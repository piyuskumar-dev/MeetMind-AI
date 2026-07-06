import asyncio
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_text_splitters import RecursiveCharacterTextSplitter
from core.llm import load_model

def split_transcript(transcript: str) -> list:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=3000,
        chunk_overlap=200
    )
    return splitter.split_text(transcript)

async def summarize_async(transcript: str) -> str:
    llm = load_model()

    map_prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            "You are a helpful assistant that summarizes transcripts concisely."
        ),
        (
            "human",
            "Summarize the following transcript in a concise manner:\n\n{transcript}"
        ),
    ])

    map_chain = map_prompt | llm | StrOutputParser()
    chunks = split_transcript(transcript)

    # Execute all chunk summaries in parallel concurrently
    chunk_summaries = await map_chain.abatch([{"transcript": chunk} for chunk in chunks])
    combined_summary = "\n\n".join(chunk_summaries)

    combined_prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            "You are an expert meeting summarizer. Combine these partial summaries into a final, professional summary in bullet points."
        ),
        (
            "human",
            "Summarize the following transcript in a concise manner:\n\n{transcript}"
        ),
    ])

    combined_chain = combined_prompt | llm | StrOutputParser()
    return await combined_chain.ainvoke({"transcript": combined_summary})

async def generate_title_async(transcript: str) -> str:
    llm = load_model()

    title_prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            "You are an expert meeting summarizer. Generate a concise and relevant title for the following transcript (in max 5-8 words). Only return the title without any additional text."
        ),
        (
            "human",
            "Generate a title for the following transcript:\n\n{transcript}"
        ),
    ])

    title_chain = title_prompt | llm | StrOutputParser()
    # Limit to first 2000 characters for title generation
    return await title_chain.ainvoke({"transcript": transcript[:2000]})

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

def summarize(transcript: str) -> str:
    return run_sync(summarize_async(transcript))

def generate_title(transcript: str) -> str:
    return run_sync(generate_title_async(transcript))