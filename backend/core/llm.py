from langchain_google_genai import ChatGoogleGenerativeAI
import os

def load_model():
    model = os.getenv("MODEL")
    api_key = os.getenv("GOOGLE_API_KEY")

    if not model:
        raise ValueError("MODEL environment variable is not set.")

    if not api_key:
        raise ValueError("GOOGLE_API_KEY environment variable is not set.")

    return ChatGoogleGenerativeAI(
        model=model,
        google_api_key=api_key,
        temperature=0.3,
    )