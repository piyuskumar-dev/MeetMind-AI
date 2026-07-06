import os
import json
import hashlib
from typing import Dict, Any, Optional

CACHE_FILE = os.path.join("downloads", "job_cache.json")

def _get_cache_key(source: str, language: str) -> str:
    """
    Generates a unique SHA-256 hash for a given source and language to act as a cache key.
    """
    normalized_source = source.strip().lower()
    # Normalize YouTube URLs if possible to ensure minor query parameter changes still hit cache
    if "youtube.com" in normalized_source or "youtu.be" in normalized_source:
        import urllib.parse as urlparse
        try:
            parsed = urlparse.urlparse(normalized_source)
            if "youtube.com" in parsed.netloc:
                query = urlparse.parse_qs(parsed.query)
                video_id = query.get("v")
                if video_id:
                    normalized_source = f"youtube:{video_id[0]}"
            elif "youtu.be" in parsed.netloc:
                video_id = parsed.path.strip("/")
                if video_id:
                    normalized_source = f"youtube:{video_id}"
        except Exception:
            pass

    raw_key = f"{normalized_source}|||{language.strip().lower()}"
    return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()

def get_cached_job(source: str, language: str) -> Optional[Dict[str, Any]]:
    """
    Retrieves a cached job if it exists.
    """
    if not os.path.exists(CACHE_FILE):
        return None
        
    try:
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            cache = json.load(f)
            
        key = _get_cache_key(source, language)
        return cache.get(key)
    except Exception as e:
        print(f"[Cache] Error reading cache file: {e}")
        return None

def save_job_to_cache(source: str, language: str, job_data: Dict[str, Any]) -> None:
    """
    Saves a completed job's details to the persistent cache file.
    """
    os.makedirs(os.path.dirname(CACHE_FILE), exist_ok=True)
    
    cache = {}
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                cache = json.load(f)
        except Exception as e:
            print(f"[Cache] Error reading cache during write: {e}")
            
    key = _get_cache_key(source, language)
    cache[key] = {
        "id": job_data.get("id"),
        "source": source,
        "language": language,
        "result": job_data.get("result"),
        "transcript": job_data.get("transcript"),
        "timestamp": job_data.get("timestamp")
    }
    
    try:
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(cache, f, indent=2, ensure_ascii=False)
        print(f"[Cache] Successfully saved job to cache under key {key[:8]}")
    except Exception as e:
        print(f"[Cache] Error writing cache file: {e}")
