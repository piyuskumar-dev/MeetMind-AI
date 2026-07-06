import asyncio
from core.analysis import analyze_transcript_async, run_sync

async def summarize_async(transcript: str) -> str:
    analysis = await analyze_transcript_async(transcript)
    return analysis["summary"]

async def generate_title_async(transcript: str) -> str:
    analysis = await analyze_transcript_async(transcript)
    return analysis["title"]

def summarize(transcript: str) -> str:
    analysis = run_sync(analyze_transcript_async(transcript))
    return analysis["summary"]

def generate_title(transcript: str) -> str:
    analysis = run_sync(analyze_transcript_async(transcript))
    return analysis["title"]