"""
backend/core/graph.py

LangGraph RAG Workflow Implementation for MeetMind AI.
Builds a modular, deterministic StateGraph (DAG) for processing RAG queries with LangSmith observability.
"""

import os
import logging
from typing import TypedDict, List, Dict, Any, Optional

from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langgraph.graph import StateGraph, START, END
from langsmith import traceable

from core.llm import load_model
from core.vector_store import load_vector_store, get_retriever

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# State Definition
# ---------------------------------------------------------------------------

class RAGState(TypedDict, total=False):
    """State schema for the MeetMind AI LangGraph RAG pipeline."""
    question: str
    job_id: str
    processed_query: str
    documents: List[Document]
    context: str
    answer: str
    sources: List[Dict[str, Any]]
    error: Optional[str]

# ---------------------------------------------------------------------------
# System Prompt & Constants
# ---------------------------------------------------------------------------

RAG_SYSTEM_PROMPT = """You are MeetMind AI, an advanced AI Meeting Assistant. Answer the user's question based ONLY on the meeting transcript context provided below.

Guidelines:
1. Ground your answer strictly in the facts from the transcript context. Do not make up facts, hallucinate, or bring in external knowledge.
2. If the answer is not mentioned in the transcript context, explicitly state: 
   "I could not find this information in the meeting transcript."
3. If specific people or speakers are mentioned in connection with tasks or decisions, attribute them clearly.
4. Format your answer nicely using clean Markdown bullets or paragraphs. Do not use complex tables unless asked.

Context from meeting transcript:
{context}"""

NO_INFO_FALLBACK = "I could not find this information in the meeting transcript."

# ---------------------------------------------------------------------------
# Node Definitions with LangSmith Tracing
# ---------------------------------------------------------------------------

@traceable(name="PreprocessQuery", run_type="parser")
def preprocess_query_node(state: RAGState) -> Dict[str, Any]:
    """
    Node 1: Preprocesses and validates user input query.
    """
    raw_query = state.get("question", "")
    if not isinstance(raw_query, str) or not raw_query.strip():
        logger.warning("[LangGraph] Empty or invalid query received.")
        return {
            "processed_query": "",
            "error": "Query string is empty or invalid."
        }
    
    cleaned_query = raw_query.strip()
    logger.info(f"[LangGraph:PreprocessQuery] Cleaned query: '{cleaned_query}'")
    return {
        "processed_query": cleaned_query,
        "error": None
    }


@traceable(name="RetrieveDocuments", run_type="retriever")
def retrieve_documents_node(state: RAGState) -> Dict[str, Any]:
    """
    Node 2: Executes similarity search over the SimpleVectorStore for the target job_id.
    """
    processed_query = state.get("processed_query", "")
    job_id = state.get("job_id", "")
    
    if state.get("error") or not processed_query:
        return {"documents": [], "sources": []}
    
    try:
        vector_store = load_vector_store()
        retriever = get_retriever(vector_store, job_id, top_k=6)
        docs: List[Document] = retriever.invoke(processed_query)
        
        sources = [
            {
                "chunk_index": doc.metadata.get("chunk_index", idx),
                "content": doc.page_content
            }
            for idx, doc in enumerate(docs)
        ]
        
        logger.info(f"[LangGraph:RetrieveDocuments] Retrieved {len(docs)} document chunks for job '{job_id}'.")
        return {"documents": docs, "sources": sources}
    except Exception as e:
        logger.error(f"[LangGraph:RetrieveDocuments] Error during retrieval: {e}")
        return {"documents": [], "sources": [], "error": f"Retrieval failed: {str(e)}"}


@traceable(name="FormatContext", run_type="prompt")
def format_context_node(state: RAGState) -> Dict[str, Any]:
    """
    Node 3: Constructs formatted context string from retrieved document chunks.
    """
    docs = state.get("documents", [])
    if not docs:
        logger.info("[LangGraph:FormatContext] No documents available for context formatting.")
        return {"context": ""}
    
    formatted_context = "\n\n".join(
        f"[Chunk {doc.metadata.get('chunk_index', idx)}]\n{doc.page_content}"
        for idx, doc in enumerate(docs)
    )
    logger.info(f"[LangGraph:FormatContext] Formatted context length: {len(formatted_context)} chars.")
    return {"context": formatted_context}


@traceable(name="GenerateAnswer", run_type="llm")
def generate_answer_node(state: RAGState) -> Dict[str, Any]:
    """
    Node 4: Invocates LLM with system prompt & formatted context to generate answer.
    """
    if state.get("error"):
        return {"answer": f"Error: {state['error']}"}
        
    context = state.get("context", "")
    processed_query = state.get("processed_query", "")
    
    if not context.strip():
        logger.info("[LangGraph:GenerateAnswer] Context is empty; returning standard no-info fallback.")
        return {"answer": NO_INFO_FALLBACK}
        
    try:
        llm = load_model()
        prompt = ChatPromptTemplate.from_messages([
            ("system", RAG_SYSTEM_PROMPT),
            ("human", "{question}")
        ])
        chain = prompt | llm | StrOutputParser()
        
        response = chain.invoke({
            "context": context,
            "question": processed_query
        })
        
        logger.info(f"[LangGraph:GenerateAnswer] Generated response length: {len(response)} chars.")
        return {"answer": response}
    except Exception as e:
        logger.error(f"[LangGraph:GenerateAnswer] Exception during LLM invocation: {e}")
        return {"answer": NO_INFO_FALLBACK, "error": f"LLM generation failed: {str(e)}"}


@traceable(name="PostprocessResponse", run_type="chain")
def postprocess_response_node(state: RAGState) -> Dict[str, Any]:
    """
    Node 5: Clean up and finalize the final state output.
    """
    raw_answer = state.get("answer", "")
    if not raw_answer or not raw_answer.strip():
        final_answer = NO_INFO_FALLBACK
    else:
        final_answer = raw_answer.strip()
        
    logger.info("[LangGraph:PostprocessResponse] Pipeline execution completed.")
    return {"answer": final_answer}

# ---------------------------------------------------------------------------
# Graph Compilation (DAG Construction)
# ---------------------------------------------------------------------------

workflow = StateGraph(RAGState)

# Add modular nodes
workflow.add_node("preprocess_query", preprocess_query_node)
workflow.add_node("retrieve_documents", retrieve_documents_node)
workflow.add_node("format_context", format_context_node)
workflow.add_node("generate_answer", generate_answer_node)
workflow.add_node("postprocess_response", postprocess_response_node)

# Add linear DAG edges
workflow.add_edge(START, "preprocess_query")
workflow.add_edge("preprocess_query", "retrieve_documents")
workflow.add_edge("retrieve_documents", "format_context")
workflow.add_edge("format_context", "generate_answer")
workflow.add_edge("generate_answer", "postprocess_response")
workflow.add_edge("postprocess_response", END)

# Compile graph into executable app
rag_graph = workflow.compile()
