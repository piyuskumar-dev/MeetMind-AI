import os
import yt_dlp
from pydub import AudioSegment

OUTPUT_DIR = "downloads"
os.makedirs(OUTPUT_DIR, exist_ok=True)

import hashlib
from typing import Optional

def get_youtube_video_id(url: str) -> Optional[str]:
    import urllib.parse as urlparse
    try:
        parsed = urlparse.urlparse(url)
        if "youtube.com" in parsed.netloc:
            query = urlparse.parse_qs(parsed.query)
            video_id = query.get("v")
            if video_id:
                return video_id[0]
        elif "youtu.be" in parsed.netloc:
            video_id = parsed.path.strip("/")
            if video_id:
                return video_id
    except Exception:
        pass
    return None

def download_audio_from_youtube(url: str) -> str:
    video_id = get_youtube_video_id(url)
    if not video_id:
        video_id = hashlib.sha256(url.encode("utf-8")).hexdigest()[:16]
        
    output_path = os.path.join(OUTPUT_DIR, f"{video_id}.wav")
    if os.path.exists(output_path):
        print(f"[AudioProcessor] YouTube audio already exists: {output_path}")
        return output_path

    ydl_opts = {
        "format": "bestaudio",
        "outtmpl": os.path.join(OUTPUT_DIR, f"{video_id}.%(ext)s"),
        "restrictfilenames": True,  # Restricts filenames to ASCII-safe characters
        "noplaylist": True,
        "quiet": False,
        "postprocessors": [
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": "wav",
            }
        ],
        "postprocessor_args": {
            "ExtractAudio": ["-ar", "16000", "-ac", "1"]
        }
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.extract_info(url, download=True)
        return output_path

def convert_to_wav(input_file: str) -> str:
    # Use SHA-256 hash of the input file path to generate a unique filename
    # to cache local files converted to wav
    path_hash = hashlib.sha256(input_file.encode("utf-8")).hexdigest()[:16]
    output_file = os.path.join(OUTPUT_DIR, f"{path_hash}_converted.wav")
    
    if os.path.exists(output_file):
        print(f"[AudioProcessor] Converted local audio already exists: {output_file}")
        return output_file
        
    audio = AudioSegment.from_file(input_file)
    audio = audio.set_channels(1)  # Convert to mono
    audio = audio.set_frame_rate(16000)  # Set sample rate to 16kHz
    audio.export(output_file, format="wav")
    return output_file

def chunk_audio(wav_path: str, chunk_length_ms: int = 10) -> list:
    import uuid
    audio = AudioSegment.from_file(wav_path)
    duration_ms = len(audio)
    chunk_ms = chunk_length_ms * 60 * 1000  # Convert minutes to milliseconds
    
    # Skip chunking if duration is less than or equal to 10 minutes
    if duration_ms <= chunk_ms:
        print(f"[AudioProcessor] File duration ({duration_ms / 1000:.1f}s) is <= 10 minutes. Skipping chunking.")
        return [wav_path]
        
    chunks = []
    for i, start in enumerate(range(0, duration_ms, chunk_ms)):
        chunk = audio[start : start + chunk_ms]
        # Generate a strictly ASCII safe unique path using UUID
        chunk_path = os.path.join(OUTPUT_DIR, f"chunk_{uuid.uuid4()}_{i}.wav")
        chunk.export(chunk_path, format="wav")
        chunks.append(chunk_path)
    return chunks

def process_input(source: str) -> list:
    if source.startswith("http://") or source.startswith("https://"):
        print(f"Downloading audio from YouTube URL: {source}")
        audio_path = download_audio_from_youtube(source)
    else:
        print(f"Using local audio file: {source}")
        try:
            audio_path = convert_to_wav(source)
        except PermissionError as e:
            raise PermissionError(
                f"Permission denied reading '{source}'. Under macOS, accessing system folders like Downloads, Desktop, or Documents is restricted. "
                f"Please move your file into the project's 'backend/downloads/' folder and try processing it using its relative path: 'downloads/{os.path.basename(source)}'"
            ) from e

    print(f"Chunking audio file: {audio_path}")
    chunks = chunk_audio(audio_path)
    print(f"Audio Ready - {len(chunks)} chunk(s) created.")
    return chunks


# print(process_input("https://youtu.be/mtiOK2QG9Q0?si=b6Q7PykbwPHO-hcy"))