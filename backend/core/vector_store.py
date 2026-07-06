import os
import pickle
import math
from langchain_core.documents import Document
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.runnables import Runnable

PERSIST_DIR = "downloads"
PERSIST_PATH = os.path.join(PERSIST_DIR, "vector_store.pkl")

class SimpleVectorStore:
    def __init__(self, persist_path=PERSIST_PATH):
        self.persist_path = persist_path
        self.data = {}  # {job_id: [{"page_content": ..., "metadata": ..., "embedding": ...}]}
        self.embeddings = None
        self.load()

    def get_embeddings(self):
        if self.embeddings is None:
            self.embeddings = GoogleGenerativeAIEmbeddings(
                model="models/gemini-embedding-001",
                google_api_key=os.getenv("GOOGLE_API_KEY")
            )
        return self.embeddings

    def load(self):
        if os.path.exists(self.persist_path):
            try:
                with open(self.persist_path, "rb") as f:
                    self.data = pickle.load(f)
            except Exception as e:
                print(f"[VectorStore] Error loading persist file: {e}")
                self.data = {}

    def save(self):
        try:
            os.makedirs(os.path.dirname(self.persist_path), exist_ok=True)
            with open(self.persist_path, "wb") as f:
                pickle.dump(self.data, f)
        except Exception as e:
            print(f"[VectorStore] Error saving persist file: {e}")

    def add_texts(self, texts: list[str], metadatas: list[dict], job_id: str):
        if job_id not in self.data:
            self.data[job_id] = []
            
        embeddings_model = self.get_embeddings()
        # Embed all texts
        embeddings = embeddings_model.embed_documents(texts)
        
        for text, meta, emb in zip(texts, metadatas, embeddings):
            self.data[job_id].append({
                "page_content": text,
                "metadata": meta,
                "embedding": emb
            })
        self.save()

    def similarity_search(self, query: str, job_id: str, k: int = 6) -> list[Document]:
        if job_id not in self.data or not self.data[job_id]:
            print(f"[VectorStore] No indexed data found for Job ID {job_id}.")
            return []
            
        embeddings_model = self.get_embeddings()
        query_embedding = embeddings_model.embed_query(query)
        
        # Calculate cosine similarity
        results = []
        for item in self.data[job_id]:
            sim = self._cosine_similarity(query_embedding, item["embedding"])
            results.append((sim, item))
            
        # Sort by similarity descending
        results.sort(key=lambda x: x[0], reverse=True)
        
        # Take top k and convert to Document
        top_k = results[:k]
        return [
            Document(page_content=item["page_content"], metadata=item["metadata"])
            for _, item in top_k
        ]

    def _cosine_similarity(self, v1, v2):
        dot = sum(x * y for x, y in zip(v1, v2))
        mag1 = math.sqrt(sum(x * x for x in v1))
        mag2 = math.sqrt(sum(x * x for x in v2))
        if not mag1 or not mag2:
            return 0.0
        return dot / (mag1 * mag2)

class SimpleInMemoryRetriever(Runnable):
    def __init__(self, job_id: str, store: SimpleVectorStore, top_k: int = 6):
        self.job_id = job_id
        self.store = store
        self.top_k = top_k
        
    def invoke(self, question: str, config=None) -> list[Document]:
        return self.store.similarity_search(question, job_id=self.job_id, k=self.top_k)

def build_vector_store(transcript: str, job_id: str) -> SimpleVectorStore:
    print(f"Building vector store for Job ID {job_id}...")

    # Split the transcript into larger, more contextually coherent chunks
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1200,
        chunk_overlap=250
    )

    chunks = splitter.split_text(transcript)

    metadatas = [
        {"chunk_index": i, "job_id": job_id}
        for i in range(len(chunks))
    ]

    vector_store = SimpleVectorStore()
    vector_store.add_texts(chunks, metadatas, job_id)

    print(f"Vector store successfully built for Job ID {job_id} ({len(chunks)} chunks indexed).")
    return vector_store

def load_vector_store() -> SimpleVectorStore:
    return SimpleVectorStore()

def get_retriever(vector_store: SimpleVectorStore, job_id: str, top_k: int = 6) -> SimpleInMemoryRetriever:
    return SimpleInMemoryRetriever(job_id, vector_store, top_k)
