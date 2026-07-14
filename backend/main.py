from dotenv import load_dotenv
load_dotenv()   # MUST be before any core/ imports

import os
import uuid
import json
import asyncio
import traceback
from typing import Dict, Any

from utils.audio_processor import process_input
from core.transcriber import transcribe_all, transcribe_chunk
from core.summarize import (
    summarize, generate_title, summarize_async, generate_title_async
)
from core.extractor import (
    extract_actionable_items, extract_key_decisions, extract_questions,
    extract_actionable_items_async, extract_key_decisions_async, extract_questions_async
)
from core.rag_engine import (
    build_rag_chain, ask_question, load_rag_chain, get_rag_components, format_docs
)
from core.vector_store import load_vector_store, build_vector_store
from utils.cache import get_cached_job, save_job_to_cache

from fastapi import FastAPI, BackgroundTasks, HTTPException, Query, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

app = FastAPI(title="AI Video Assistant API")
print("🚀 AI Video Assistant API is starting...")
print("Fastapi started. Listening for requests on http://localhost:8000")

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=['https://meet-mind-ai-py.vercel.app', 'http://localhost:5173'],  # In production, specify the frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory database to store job status and events
# Format:
# jobs[job_id] = {
#     "id": job_id,
#     "source": source,
#     "language": language,
#     "status": "pending" | "running" | "completed" | "failed",
#     "progress": int,
#     "events": List[Dict[str, Any]],
#     "result": Dict[str, Any] or None,
#     "error": str or None
# }
jobs: Dict[str, Dict[str, Any]] = {}
rag_chains: Dict[str, Any] = {}


class ChatRequest(BaseModel):
    job_id: str
    question: str

async def run_job_pipeline(job_id: str, temp_filepath: str, file_hash: str, language: str):
    """
    Executes the pipeline steps in an async runner and updates job progress.
    """
    job = jobs[job_id]
    chunks = []
    
    def log_event(event_type: str, progress: int, status: str = "running", extra_data: dict = None):
        data = {"status": status, "progress": progress}
        if extra_data:
            data.update(extra_data)
        job["progress"] = progress
        job["events"].append({"event": event_type, "data": data})
        print(f"[Job {job_id}] Event: {event_type} - progress: {progress}%")

    try:
        log_event("processing_started", 5)

        # 0. Check persistent job cache first to save costly computations
        cache_source_key = f"hash:{file_hash}"
        cached_job = get_cached_job(cache_source_key, language)
        if cached_job:
            print(f"[Job {job_id}] Cache hit found! Loading cached results...")
            
            # Map cached output to our current job ID
            job["result"] = cached_job["result"]
            job["transcript"] = cached_job["transcript"]
            job["status"] = "completed"
            
            # Clean up the original file immediately on cache hit
            if os.path.exists(temp_filepath):
                try:
                    os.remove(temp_filepath)
                    print(f"[Cleanup] Eagerly removed temp upload file on cache hit: {temp_filepath}")
                except Exception as e:
                    print(f"[Cleanup] Error removing temp file: {e}")

            # Index/Verify vector DB in background if not present
            try:
                vector_store = load_vector_store()
                if job_id not in vector_store.data or not vector_store.data[job_id]:
                    print(f"[Job {job_id}] Re-indexing transcript chunks in background...")
                    await asyncio.to_thread(build_vector_store, cached_job["transcript"], job_id)
            except Exception as e:
                print(f"[Job {job_id}] Cache vector DB validation issue: {e}")

            # Replay progression stream quickly to let client update UI state
            log_event("audio_extracted", 25, extra_data={"chunks_count": 1})
            log_event("transcription_completed", 50)
            log_event("building_rag", 90)
            
            # Cache the RAG chain loader
            rag_chains[job_id] = load_rag_chain(job_id)
            
            log_event("completed", 100, status="completed", extra_data={**cached_job["result"], "transcript": cached_job["transcript"]})
            return

        # 1. Process input (extract audio & chunk)
        log_event("audio_extraction_started", 10)
        # Process input runs ffmpeg tasks and file splits. Execute in executor thread.
        chunks = await asyncio.to_thread(process_input, temp_filepath)
        log_event("audio_extracted", 25, extra_data={"chunks_count": len(chunks)})

        # Eagerly delete the original uploaded file immediately after audio processing
        if os.path.exists(temp_filepath):
            try:
                os.remove(temp_filepath)
                print(f"[Cleanup] Eagerly removed original uploaded file: {temp_filepath}")
            except Exception as e:
                print(f"[Cleanup] Error removing uploaded file {temp_filepath}: {e}")

        # 2. Transcription chunk by chunk (non-blocking thread)
        log_event("transcribing", 30, extra_data={"chunk": 0, "total_chunks": len(chunks)})
        
        translate = (language == "english")
        full_transcription = ""
        total_chunks = len(chunks)
        
        for i, chunk_path in enumerate(chunks):
            log_event("transcribing", 30 + int((i / total_chunks) * 20), extra_data={
                "chunk": i + 1,
                "total_chunks": total_chunks,
                "message": f"Transcribing chunk {i+1} of {total_chunks}"
            })
            result = await asyncio.to_thread(transcribe_chunk, chunk_path, translate=translate)
            full_transcription += result + " "
            
            # Eagerly delete chunk file immediately after transcription
            try:
                if os.path.exists(chunk_path):
                    os.remove(chunk_path)
                    print(f"[Cleanup] Eagerly removed transcribed chunk file: {chunk_path}")
            except Exception as e:
                print(f"[Cleanup] Error removing chunk file {chunk_path}: {e}")
            
        transcript = full_transcription.strip()
        job["transcript"] = transcript
        log_event("transcription_completed", 50)

        # Clean up the empty chunks directory
        if chunks:
            try:
                chunks_dir = os.path.dirname(chunks[0])
                if os.path.exists(chunks_dir) and not os.listdir(chunks_dir):
                    os.rmdir(chunks_dir)
                    print(f"[Cleanup] Removed empty chunks directory: {chunks_dir}")
            except Exception as e:
                print(f"[Cleanup] Error removing chunks directory: {e}")

        # 3. Generate Analysis outputs using a single consolidated LLM call
        log_event("generating_summary", 60)
        from core.analysis import analyze_transcript_async
        analysis = await analyze_transcript_async(transcript)
        
        title = analysis["title"]
        summary = analysis["summary"]
        action_items = analysis["action_items"]
        decisions = analysis["decisions"]
        questions = analysis["questions"]
        
        # Sequentially trigger log stages for smooth frontend sequence progression
        log_event("generating_title", 70)
        await asyncio.sleep(0.1)
        log_event("extracting_action_items", 80)
        await asyncio.sleep(0.1)
        log_event("extracting_decisions", 85)
        await asyncio.sleep(0.1)
        log_event("extracting_questions", 90)
        await asyncio.sleep(0.1)

        # 4. Build RAG Knowledge Base
        log_event("building_rag", 95)
        # Vector database builds Sentence-Transformers embeds. Keep in thread pool.
        await asyncio.to_thread(build_vector_store, transcript, job_id)
        rag_chains[job_id] = load_rag_chain(job_id)
        
        result_payload = {
            "title": title,
            "summary": summary,
            "action_items": action_items,
            "decisions": decisions,
            "key_decisions": decisions,  # compatibility key
            "questions": questions,
            "open_questions": questions,  # compatibility key
        }
        
        job["result"] = result_payload
        job["status"] = "completed"
        
        # Save output to persistent cache
        save_job_to_cache(
            source=cache_source_key,
            language=language,
            job_data={
                "id": job_id,
                "result": result_payload,
                "transcript": transcript,
                "timestamp": job.get("timestamp")
            }
        )
        
        # Log final completed event with data payload
        log_event("completed", 100, status="completed", extra_data={**result_payload, "transcript": transcript})

    except Exception as e:
        error_msg = str(e)
        tb = traceback.format_exc()
        print(f"[Job {job_id}] Exception occurred:\n{tb}")
        job["status"] = "failed"
        job["error"] = error_msg
        log_event("error", job["progress"], status="failed", extra_data={"message": error_msg})
        
    finally:
        # Fallback cleanups to prevent storage leaks if an exception occurred
        if temp_filepath and os.path.exists(temp_filepath):
            try:
                os.remove(temp_filepath)
                print(f"[Cleanup Fallback] Removed temporary uploaded file: {temp_filepath}")
            except Exception:
                pass
            
        for chunk_path in chunks:
            try:
                if os.path.exists(chunk_path):
                    os.remove(chunk_path)
                    print(f"[Cleanup Fallback] Removed chunk WAV file: {chunk_path}")
            except Exception:
                pass
                
        if chunks:
            try:
                chunks_dir = os.path.dirname(chunks[0])
                if os.path.exists(chunks_dir):
                    for f in os.listdir(chunks_dir):
                        os.remove(os.path.join(chunks_dir, f))
                    os.rmdir(chunks_dir)
                    print(f"[Cleanup Fallback] Removed chunks directory: {chunks_dir}")
            except Exception:
                pass



def run_pipeline_sync(source: str, language: str = "english"):
    """
    Synchronous version of the pipeline for CLI usage.
    """
    print("Starting the AI Video Assistant pipeline (Sync)...")
    chunks = process_input(source)
    transcript = transcribe_all(chunks, translate=(language == "english"))
    
    title = generate_title(transcript)
    summary = summarize(transcript)
    action_items = extract_actionable_items(transcript)
    decisions = extract_key_decisions(transcript)
    questions = extract_questions(transcript)
    
    job_id = "cli_sync"
    build_vector_store(transcript, job_id)
    rag_chain = load_rag_chain(job_id)

    return {
        "title": title,
        "summary": summary,
        "action_items": action_items,
        "decisions": decisions,
        "questions": questions,
        "rag_chain": rag_chain
    }


@app.get("/")
async def root():
    return {"message": "AI Video Assistant is running!"}


@app.post("/process")
async def process_video(
    file: UploadFile = File(...),
    language: str = Form("english"),
    background_tasks: BackgroundTasks = None
):
    """
    Asynchronous endpoint to trigger processing. Returns a job_id immediately.
    """
    filename = file.filename
    if not filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    allowed_exts = {'mp4', 'mp3', 'wav', 'mov', 'm4a', 'aac'}
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file extension: .{ext}. Supported formats are: {', '.join(allowed_exts)}"
        )
        
    job_id = str(uuid.uuid4())
    
    os.makedirs("downloads", exist_ok=True)
    temp_filename = f"{uuid.uuid4()}_{filename}"
    temp_filepath = os.path.join("downloads", temp_filename)
    
    import hashlib
    sha256 = hashlib.sha256()
    total_bytes = 0
    min_size = 1 * 1024 * 1024       # 1 MB
    max_size = 300 * 1024 * 1024     # 300 MB
    
    # Check Content-Length header first for quick rejection
    content_length = file.headers.get("content-length")
    if content_length:
        size_bytes = int(content_length)
        if size_bytes < min_size:
            raise HTTPException(status_code=400, detail="File size is too small. Minimum required size is 1MB.")
        if size_bytes > max_size:
            raise HTTPException(status_code=400, detail="File size exceeds the 300MB limit.")

    try:
        with open(temp_filepath, "wb") as buffer:
            while chunk := await file.read(65536):
                total_bytes += len(chunk)
                if total_bytes > max_size:
                    raise HTTPException(status_code=400, detail="File size exceeds the 300MB limit.")
                buffer.write(chunk)
                sha256.update(chunk)
                
        if total_bytes < min_size:
            raise HTTPException(status_code=400, detail="File size is too small. Minimum required size is 1MB.")
    except HTTPException:
        if os.path.exists(temp_filepath):
            try:
                os.remove(temp_filepath)
            except Exception:
                pass
        raise
    except Exception as e:
        if os.path.exists(temp_filepath):
            try:
                os.remove(temp_filepath)
            except Exception:
                pass
        raise HTTPException(status_code=500, detail=f"Failed to save uploaded file: {str(e)}")
        
    file_hash = sha256.hexdigest()
    import datetime
    
    jobs[job_id] = {
        "id": job_id,
        "source": filename, # User-friendly display name (original filename)
        "file_hash": file_hash,
        "language": language,
        "status": "pending",
        "progress": 0,
        "events": [],
        "result": None,
        "error": None,
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
    }
    
    if background_tasks:
        background_tasks.add_task(run_job_pipeline, job_id, temp_filepath, file_hash, language)
    
    return {"job_id": job_id}


@app.get("/stream/{job_id}")
async def stream_job(job_id: str):
    """
    Server-Sent Events endpoint that streams progress updates for a job.
    """
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    async def event_generator():
        job = jobs[job_id]
        read_index = 0
        
        while True:
            # Yield any unread events
            while read_index < len(job["events"]):
                event_data = job["events"][read_index]
                read_index += 1
                yield f"event: {event_data['event']}\ndata: {json.dumps(event_data['data'])}\n\n"
            
            # Terminate only if the job has finished and the final state event (completed/error) has been yielded
            if job["status"] in ["completed", "failed"]:
                event_names = [e["event"] for e in job["events"]]
                if "completed" in event_names or "error" in event_names:
                    break
                
            await asyncio.sleep(0.5)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """
    POST endpoint for streaming RAG responses token-by-token.
    """
    job_id = request.job_id
    question = request.question

    try:
        retriever, llm_chain = get_rag_components(job_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"RAG system not initialized: {e}")

    async def response_generator():
        try:
            # 1. Retrieve the matching docs using ainvoke (async non-blocking)
            docs = await retriever.ainvoke(question)
            
            # 2. Yield the sources to the client
            sources_data = [
                {
                    "chunk_index": doc.metadata.get("chunk_index", 0),
                    "content": doc.page_content
                }
                for doc in docs
            ]
            yield f"event: sources\ndata: {json.dumps(sources_data)}\n\n"
            
            # 3. Stream the generation tokens from the LLM chain
            context_str = format_docs(docs)
            async for chunk in llm_chain.astream({"context": context_str, "question": question}):
                yield f"data: {json.dumps({'token': chunk})}\n\n"
                
            yield "event: completed\ndata: {}\n\n"
        except Exception as e:
            yield f"event: error\ndata: {json.dumps({'message': str(e)})}\n\n"

    return StreamingResponse(response_generator(), media_type="text/event-stream")


@app.get("/chat/stream")
async def chat_stream_get(job_id: str = Query(...), question: str = Query(...)):
    """
    GET version of chat streaming for standard EventSource compatibility.
    """
    try:
        retriever, llm_chain = get_rag_components(job_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"RAG system not initialized: {e}")

    async def response_generator():
        try:
            # 1. Retrieve the matching docs using ainvoke
            docs = await retriever.ainvoke(question)
            
            # 2. Yield the sources to the client
            sources_data = [
                {
                    "chunk_index": doc.metadata.get("chunk_index", 0),
                    "content": doc.page_content
                }
                for doc in docs
            ]
            yield f"event: sources\ndata: {json.dumps(sources_data)}\n\n"
            
            # 3. Stream the generation tokens
            context_str = format_docs(docs)
            async for chunk in llm_chain.astream({"context": context_str, "question": question}):
                yield f"data: {json.dumps({'token': chunk})}\n\n"
                
            yield "event: completed\ndata: {}\n\n"
        except Exception as e:
            yield f"event: error\ndata: {json.dumps({'message': str(e)})}\n\n"

    return StreamingResponse(response_generator(), media_type="text/event-stream")


if __name__ == "__main__":
    # CLI entry point
    import sys
    source = input("Enter local file path: ").strip()
    language = input("Language (english/hinglish): ").strip() or "english"
    result = run_pipeline_sync(source, language)

    print("\n" + "=" * 60)
    print(f"📌 Title: {result['title']}")
    print(f"\n📋 Summary:\n{result['summary']}")
    print(f"\n✅ Action Items:\n{result['action_items']}")
    print(f"\n🔑 Key Decisions:\n{result['decisions']}")
    print(f"\n❓ Open Questions:\n{result['questions']}")
    print("=" * 60)

    # CLI Chat loop
    print("\n💬 Chat with your meeting (type 'exit' to quit)\n")
    job_id = "cli_sync"
    retriever, llm_chain = get_rag_components(job_id)
    while True:
        question = input("You: ").strip()
        if question.lower() in ["exit", "quit", "q"]:
            print("👋 Goodbye!")
            break
        if not question:
            continue
        answer = ask_question(retriever, question, llm_chain)
        print(f"\n🤖 Assistant: {answer}\n")