import asyncio
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from core.llm import load_model

def build_chain(system_prompt: str):
    llm = load_model()

    prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            system_prompt
        ),
        (
            "human",
            "{transcript}"
        ),
    ])

    chain = prompt | llm | StrOutputParser()
    return chain

async def extract_actionable_items_async(transcript: str) -> str:
    chain = build_chain(
        "You are an expert meeting analyst. From the meeting transcript, "
        "extract all action items. For each provide:\n"
        "- Task description\n"
        "- Owner (who is responsible)\n"
        "- Deadline (if mentioned, else write 'Not specified')\n\n"
        "Format as a numbered list. If none found say 'No action items found.'"
    )
    return await chain.ainvoke({"transcript": transcript})

async def extract_key_decisions_async(transcript: str) -> str:
    chain = build_chain(
        "You are an expert meeting analyst. From the meeting transcript, "
        "extract all key decisions made. Format as a numbered list. "
        "If none found say 'No key decisions found.'"
    )
    return await chain.ainvoke({"transcript": transcript})

async def extract_questions_async(transcript: str) -> str:
    chain = build_chain(
        "From the meeting transcript, extract all unresolved questions "
        "or topics needing follow-up. Format as a numbered list. "
        "If none found say 'No open questions found.'"
    )
    return await chain.ainvoke({"transcript": transcript})

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

def extract_actionable_items(transcript: str) -> str:
    return run_sync(extract_actionable_items_async(transcript))

def extract_key_decisions(transcript: str) -> str:
    return run_sync(extract_key_decisions_async(transcript))

def extract_questions(transcript: str) -> str:
    return run_sync(extract_questions_async(transcript))