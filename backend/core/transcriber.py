import os
from google import genai

def transcribe_chunk(chunk_path: str, translate: bool = False) -> str:
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_API_KEY environment variable is not set.")

    client = genai.Client(api_key=api_key)

    print(f"[Transcriber] Uploading chunk {chunk_path} to Gemini...")
    audio_file = client.files.upload(file=chunk_path)

    prompt = (
        "Translate this audio to English and transcribe it. Output only the translated English transcription text without comments or formatting."
        if translate
        else "Transcribe this audio exactly. Output only the transcription text without comments or formatting."
    )

    try:
        print(f"[Transcriber] Transcribing chunk using Gemini API...")
        response = client.models.generate_content(
            model="gemini-3.1-flash-lite",
            contents=[audio_file, prompt]
        )
        return response.text.strip()
    finally:
        print(f"[Transcriber] Deleting uploaded file {audio_file.name} from Gemini storage...")
        try:
            client.files.delete(name=audio_file.name)
        except Exception as e:
            print(f"[Transcriber] Error deleting file: {e}")

def transcribe_all(chunks: list, translate: bool = False) -> str:
    full_transcription = ""
    for i, chunk_path in enumerate(chunks):
        print(f"Transcribing chunk: {i+1} of {len(chunks)}")
        result = transcribe_chunk(chunk_path, translate=translate)
        full_transcription += result + " "
        
        # Eagerly delete chunk file to save disk space
        try:
            if os.path.exists(chunk_path):
                os.remove(chunk_path)
                print(f"[Cleanup] Eagerly removed transcribed chunk file: {chunk_path}")
        except Exception as e:
            print(f"[Cleanup] Error removing chunk file {chunk_path}: {e}")
            
    print(f"Transcription completed for all chunks.")
    
    # Try to clean up the chunks directory if it is now empty
    if chunks:
        try:
            chunks_dir = os.path.dirname(chunks[0])
            if os.path.exists(chunks_dir) and not os.listdir(chunks_dir):
                os.rmdir(chunks_dir)
                print(f"[Cleanup] Removed empty chunks directory: {chunks_dir}")
        except Exception as e:
            print(f"[Cleanup] Error removing chunks directory: {e}")
            
    return full_transcription