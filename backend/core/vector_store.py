import os
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

CHROMA_DIR = "vector_store"
COLLECTION_NAME = "meeting_transcripts"
EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

# In-memory global cache for embedding model to prevent redundant re-instantiation
_embeddings = None

def get_embeddings():
    global _embeddings
    if _embeddings is None:
        print("[Embeddings] Initializing Hugging Face Sentence-Transformers model...")
        _embeddings = HuggingFaceEmbeddings(
            model_name=EMBEDDING_MODEL_NAME,
            model_kwargs={"device": "cpu"}
        )
        print("[Embeddings] Embedding model loaded successfully.")
    return _embeddings

def build_vector_store(transcript: str, job_id: str) -> Chroma:
    print(f"Building vector store for Job ID {job_id}...")

    # Split the transcript into larger, more contextually coherent chunks
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1200,
        chunk_overlap=250
    )

    chunks = splitter.split_text(transcript)

    # Embed chunks and tag them with job_id for metadata filtering
    docs = [
        Document(page_content=chunk, metadata={"chunk_index": i, "job_id": job_id})
        for i, chunk in enumerate(chunks)
    ]

    embeddings = get_embeddings()
    vector_store = Chroma.from_documents(
        documents=docs,
        embedding=embeddings,
        persist_directory=CHROMA_DIR,
        collection_name=COLLECTION_NAME
    )

    print(f"Vector store successfully built for Job ID {job_id} ({len(docs)} chunks indexed).")
    return vector_store

def load_vector_store() -> Chroma:
    if not os.path.exists(CHROMA_DIR):
        # Create empty directory if it doesn't exist yet
        os.makedirs(CHROMA_DIR, exist_ok=True)

    embeddings = get_embeddings()
    vector_store = Chroma(
        persist_directory=CHROMA_DIR,
        collection_name=COLLECTION_NAME,
        embedding_function=embeddings
    )

    return vector_store

def get_retriever(vector_store: Chroma, job_id: str, top_k: int = 6):
    """
    Returns a retriever configured to return only chunks matching the current job_id.
    """
    return vector_store.as_retriever(
        search_type="similarity",
        search_kwargs={
            "k": top_k,
            "filter": {"job_id": job_id}
        }
    )
