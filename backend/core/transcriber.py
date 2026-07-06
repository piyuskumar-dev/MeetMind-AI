import whisper
import os

WHISPER_MODEL = os.getenv("WHISPER_MODEL", "small")  # Set your Whisper model here or in your environment variables

_model = None

def load_model():

    global _model

    if _model is None:
        print(f"Loading Whisper model")
        _model = whisper.load_model(WHISPER_MODEL)
        print(f"Whisper model loaded successfully")

    return _model

def transcribe_chunk(chunk_path: str, translate: bool = False) -> str:

    model = load_model()

    task = "translate" if translate else "transcribe"

    result = model.transcribe(chunk_path, task=task)

    return result['text']

def transcribe_all(chunks: list, translate: bool = False) -> str:

    full_transcription = ""

    for i, chunk_path in enumerate(chunks):
        print(f"Transcribing chunk: {i+1}")
        result = transcribe_chunk(chunk_path, translate=translate)
        full_transcription += result + " "

    print(f"Transcription completed for all chunks.")

    return full_transcription