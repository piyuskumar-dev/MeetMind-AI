"""
backend/core/rag_engine.py

High-level interface for the MeetMind AI RAG Engine.
Wraps the compiled LangGraph workflow from core.graph with token streaming,
source citation extraction, LangSmith tracing, and legacy backwards compatibility wrappers.
"""

import logging
from typing import Dict, Any, AsyncGenerator, Tuple, Optional, List
from langchain_core.documents import Document

from core.graph import (
    rag_graph, RAGState, NO_INFO_FALLBACK,
    preprocess_query_node, retrieve_documents_node, format_context_node
)
from core.llm import load_model
from core.vector_store import (
    build_vector_store, load_vector_store, get_retriever,
    SimpleVectorStore, SimpleInMemoryRetriever
)
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

logger = logging.getLogger(__name__)

def format_docs(docs: List[Document]) -> str:
    """Helper to format documents into chunked text block."""
    return "\n\n".join(
        f"[Chunk {doc.metadata.get('chunk_index', idx)}]\n{doc.page_content}"
        for idx, doc in enumerate(docs)
    )

import os

def _get_langsmith_config(job_id: str, question: str, run_name_prefix: str = "RAG_Execution") -> Dict[str, Any]:
    """Generates production-friendly LangSmith configuration metadata."""
    api_key = os.getenv("LANGCHAIN_API_KEY", "").strip()
    if not api_key:
        os.environ["LANGCHAIN_TRACING_V2"] = "false"
    else:
        os.environ["LANGCHAIN_TRACING_V2"] = "true"

    return {
        "run_name": f"{run_name_prefix}_{job_id[:8]}",
        "tags": ["meetmind", "langgraph", "rag"],
        "metadata": {
            "job_id": job_id,
            "question": question,
        }
    }

def run_rag_graph(job_id: str, question: str) -> Dict[str, Any]:
    """
    Executes the full LangGraph RAG DAG workflow synchronously.
    Returns state dict with keys: 'answer', 'sources', 'documents', 'error'.
    """
    config = _get_langsmith_config(job_id, question, run_name_prefix="RAG_Graph_Run")
    initial_state: RAGState = {
        "question": question,
        "job_id": job_id
    }
    
    try:
        final_state = rag_graph.invoke(initial_state, config=config)
        return final_state
    except Exception as e:
        logger.error(f"[RAG Engine] Graph execution failed: {e}")
        return {
            "question": question,
            "job_id": job_id,
            "answer": NO_INFO_FALLBACK,
            "sources": [],
            "error": str(e)
        }

async def stream_rag_graph_tokens(job_id: str, question: str) -> AsyncGenerator[Dict[str, Any], None]:
    """
    Async generator that executes retrieval & streams generation tokens token-by-token.
    Yields events:
      {"type": "sources", "data": [...]}
      {"type": "token", "data": "..."}
      {"type": "completed", "data": {}}
      {"type": "error", "data": "..."}
    """
    config = _get_langsmith_config(job_id, question, run_name_prefix="RAG_Stream")
    
    # 1. Execute preprocessing & document retrieval nodes
    prep_state = preprocess_query_node({"question": question, "job_id": job_id})
    if prep_state.get("error"):
        yield {"type": "error", "data": prep_state["error"]}
        return
        
    retrieval_state = retrieve_documents_node({
        "question": question,
        "job_id": job_id,
        "processed_query": prep_state["processed_query"]
    })
    
    sources = retrieval_state.get("sources", [])
    yield {"type": "sources", "data": sources}
    
    # 2. Format context
    fmt_state = format_context_node({"documents": retrieval_state.get("documents", [])})
    context_str = fmt_state.get("context", "")
    
    if not context_str.strip():
        yield {"type": "token", "data": NO_INFO_FALLBACK}
        yield {"type": "completed", "data": {}}
        return

    # 3. Stream generation tokens
    try:
        llm = load_model()
        from core.graph import RAG_SYSTEM_PROMPT
        prompt = ChatPromptTemplate.from_messages([
            ("system", RAG_SYSTEM_PROMPT),
            ("human", "{question}")
        ])
        chain = prompt | llm | StrOutputParser()
        
        async for chunk in chain.astream({"context": context_str, "question": prep_state["processed_query"]}, config=config):
            yield {"type": "token", "data": chunk}
            
        yield {"type": "completed", "data": {}}
    except Exception as e:
        logger.error(f"[RAG Engine] Streaming error: {e}")
        yield {"type": "error", "data": str(e)}

# ---------------------------------------------------------------------------
# Backward Compatibility Helpers
# ---------------------------------------------------------------------------

def get_llm_chain():
    """Legacy helper returning LCEL generation chain."""
    llm = load_model()
    from core.graph import RAG_SYSTEM_PROMPT
    prompt = ChatPromptTemplate.from_messages([
        ("system", RAG_SYSTEM_PROMPT),
        ("human", "{question}"),
    ])
    return prompt | llm | StrOutputParser()

def build_rag_chain(transcript: str, job_id: str):
    """Builds vector store and returns legacy chain compatibility interface."""
    build_vector_store(transcript, job_id)
    return load_rag_chain(job_id)

def load_rag_chain(job_id: str):
    """Loads vector store and returns graph execution wrapper."""
    class GraphChainWrapper:
        def __init__(self, job_id: str):
            self.job_id = job_id
        def invoke(self, question: str) -> str:
            res = run_rag_graph(self.job_id, question)
            return res.get("answer", NO_INFO_FALLBACK)
    return GraphChainWrapper(job_id)

def get_rag_components(job_id: str) -> Tuple[SimpleInMemoryRetriever, Any]:
    """Returns isolated retriever and LLM generation chain."""
    vector_store = load_vector_store()
    retriever = get_retriever(vector_store, job_id)
    llm_chain = get_llm_chain()
    return retriever, llm_chain

def ask_question(rag_chain_or_retriever, question: str, llm_chain=None) -> str:
    """Handles question answering via LangGraph engine or legacy interface."""
    if hasattr(rag_chain_or_retriever, "job_id"):
        res = run_rag_graph(rag_chain_or_retriever.job_id, question)
        return res.get("answer", NO_INFO_FALLBACK)
    elif llm_chain is not None:
        docs = rag_chain_or_retriever.invoke(question)
        context = format_docs(docs)
        return llm_chain.invoke({"context": context, "question": question})
    else:
        return rag_chain_or_retriever.invoke(question)