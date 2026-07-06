from core.llm import load_model
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from core.vector_store import get_retriever, load_vector_store, build_vector_store
from langchain_core.runnables import RunnablePassthrough, RunnableLambda

def format_docs(docs):
    return "\n\n".join(
        f"[Chunk {doc.metadata.get('chunk_index', idx)}]\n{doc.page_content}"
        for idx, doc in enumerate(docs)
    )

def get_llm_chain():
    llm = load_model()
    prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            """You are MeetMind AI, an advanced AI Meeting Assistant. Answer the user's question based ONLY on the meeting transcript context provided below.

Guidelines:
1. Ground your answer strictly in the facts from the transcript context. Do not make up facts, hallucinate, or bring in external knowledge.
2. If the answer is not mentioned in the transcript context, explicitly state: 
   "I could not find this information in the meeting transcript."
3. If specific people or speakers are mentioned in connection with tasks or decisions, attribute them clearly.
4. Format your answer nicely using clean Markdown bullets or paragraphs. Do not use complex tables unless asked.

Context from meeting transcript:
{context}"""
        ),
        ("human", "{question}"),
    ])
    return prompt | llm | StrOutputParser()

def build_rag_chain(transcript: str, job_id: str):
    """
    Builds the vector store and returns a combined LCEL chain.
    """
    vector_store = build_vector_store(transcript, job_id)
    retriever = get_retriever(vector_store, job_id)
    llm_chain = get_llm_chain()

    # Fallback combined chain for backwards compatibility
    rag_chain = (
        {"context": retriever | RunnableLambda(format_docs),
         "question": RunnablePassthrough()}
        | llm_chain
    )
    return rag_chain

def load_rag_chain(job_id: str):
    """
    Loads the vector store and returns a combined LCEL chain.
    """
    vector_store = load_vector_store()
    retriever = get_retriever(vector_store, job_id)
    llm_chain = get_llm_chain()

    # Fallback combined chain for backwards compatibility
    rag_chain = (
        {"context": retriever | RunnableLambda(format_docs),
         "question": RunnablePassthrough()}
        | llm_chain
    )
    return rag_chain

def get_rag_components(job_id: str):
    """
    Returns the isolated retriever and LLM generation chain for customized streaming.
    """
    vector_store = load_vector_store()
    retriever = get_retriever(vector_store, job_id)
    llm_chain = get_llm_chain()
    return retriever, llm_chain

def ask_question(rag_chain_or_retriever, question: str, llm_chain=None):
    """
    Handles question answering, compatible with both old combined chains and new isolated components.
    """
    if llm_chain is not None:
        docs = rag_chain_or_retriever.invoke(question)
        context = format_docs(docs)
        return llm_chain.invoke({"context": context, "question": question})
    else:
        # Fallback to combined chain invocation
        return rag_chain_or_retriever.invoke(question)