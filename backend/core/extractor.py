import asyncio
from core.analysis import analyze_transcript_async, run_sync

async def extract_actionable_items_async(transcript: str) -> str:
    analysis = await analyze_transcript_async(transcript)
    return analysis["action_items"]

async def extract_key_decisions_async(transcript: str) -> str:
    analysis = await analyze_transcript_async(transcript)
    return analysis["decisions"]

async def extract_questions_async(transcript: str) -> str:
    analysis = await analyze_transcript_async(transcript)
    return analysis["questions"]

def extract_actionable_items(transcript: str) -> str:
    analysis = run_sync(analyze_transcript_async(transcript))
    return analysis["action_items"]

def extract_key_decisions(transcript: str) -> str:
    analysis = run_sync(analyze_transcript_async(transcript))
    return analysis["decisions"]

def extract_questions(transcript: str) -> str:
    analysis = run_sync(analyze_transcript_async(transcript))
    return analysis["questions"]