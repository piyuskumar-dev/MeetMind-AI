import os
import json
import asyncio
from pydantic import BaseModel, Field
from core.llm import load_model

class MeetingAnalysis(BaseModel):
    title: str = Field(description="A concise and relevant title for the meeting (5-8 words)")
    summary: str = Field(description="A concise summary of the meeting transcript in bullet points")
    action_items: str = Field(description="All action items extracted from the transcript. For each, provide a numbered list with task description, owner (who is responsible), and deadline (if mentioned, else 'Not specified').")
    decisions: str = Field(description="All key decisions made during the meeting, formatted as a numbered list.")
    questions: str = Field(description="All unresolved questions or topics needing follow-up, formatted as a numbered list.")

async def analyze_transcript_async(transcript: str) -> dict:
    if not transcript or not transcript.strip():
        return {
            "title": "Untitled Meeting",
            "summary": "No transcript available to summarize.",
            "action_items": "No action items found.",
            "decisions": "No key decisions found.",
            "questions": "No open questions found."
        }

    llm = load_model()
    
    # Attempt to use langchain's with_structured_output which is the most reliable
    try:
        print("[Analysis] Running structured analysis using Gemini...")
        structured_llm = llm.with_structured_output(MeetingAnalysis)
        result = await structured_llm.ainvoke(transcript)
        return {
            "title": result.title.strip(),
            "summary": result.summary.strip(),
            "action_items": result.action_items.strip(),
            "decisions": result.decisions.strip(),
            "questions": result.questions.strip()
        }
    except Exception as e:
        print(f"[Analysis] structured output failed: {e}. Falling back to manual JSON parsing...")
        
        # Fallback to direct prompt asking for JSON
        prompt = f"""You are an expert meeting analyst. Analyze the following transcript and generate a structured summary.
You must output a raw JSON object containing exactly the following keys:
- "title": A short descriptive title of 5-8 words.
- "summary": A concise summary in markdown bullet points.
- "action_items": A numbered list of action items with task description, owner (who is responsible), and deadline (if mentioned, else 'Not specified').
- "decisions": A numbered list of key decisions made.
- "questions": A numbered list of unresolved questions or topics needing follow-up.

Ensure your output is valid JSON and only returns the JSON block. Do not include any conversational filler or code block decorations.

Transcript:
{transcript}"""
        
        response = await llm.ainvoke(prompt)
        text = response.content.strip()
        
        # Clean markdown code blocks if the model wrapped it
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        
        try:
            data = json.loads(text)
            return {
                "title": data.get("title", "Meeting Analysis").strip(),
                "summary": data.get("summary", "No summary generated.").strip(),
                "action_items": data.get("action_items", "No action items found.").strip(),
                "decisions": data.get("decisions", "No key decisions found.").strip(),
                "questions": data.get("questions", "No open questions found.").strip()
            }
        except Exception as json_err:
            print(f"[Analysis] JSON parsing failed: {json_err}. Raw output was: {text}")
            # Final fallback in case model completely fails to return JSON
            return {
                "title": "Meeting Analysis",
                "summary": text,
                "action_items": "Failed to parse action items from response.",
                "decisions": "Failed to parse decisions from response.",
                "questions": "Failed to parse questions from response."
            }

def run_sync(coro):
    """
    Safely runs a coroutine synchronously, even if an event loop is already running.
    """
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
    if loop.is_running():
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor() as executor:
            return executor.submit(lambda: asyncio.run(coro)).result()
    else:
        return loop.run_until_complete(coro)

def analyze_transcript(transcript: str) -> dict:
    return run_sync(analyze_transcript_async(transcript))
