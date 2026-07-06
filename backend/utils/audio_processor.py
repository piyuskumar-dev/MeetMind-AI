import os
import hashlib
from pydub import AudioSegment

OUTPUT_DIR = "downloads"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def convert_to_wav(input_file: str) -> str:
    """
    Converts a local media file to a 16kHz mono WAV format.
    Uses SHA-256 hash of the input file path for caching.
    """
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

def chunk_audio(wav_path: str, chunk_length_min: int = 10) -> list:
    """
    Splits the audio file into smaller chunks of chunk_length_min minutes.
    If the audio is shorter than the limit, returns the path to the original file in a list.
    """
    import uuid
    audio = AudioSegment.from_file(wav_path)
    duration_ms = len(audio)
    chunk_ms = chunk_length_min * 60 * 1000  # Convert minutes to milliseconds
    
    # Skip chunking if duration is less than or equal to the limit
    if duration_ms <= chunk_ms:
        print(f"[AudioProcessor] File duration ({duration_ms / 1000:.1f}s) is <= {chunk_length_min} minutes. Skipping chunking.")
        return [wav_path]
        
    chunks = []
    for i, start in enumerate(range(0, duration_ms, chunk_ms)):
        chunk = audio[start : start + chunk_ms]
        # Generate a unique path using UUID
        chunk_path = os.path.join(OUTPUT_DIR, f"chunk_{uuid.uuid4()}_{i}.wav")
        chunk.export(chunk_path, format="wav")
        chunks.append(chunk_path)
    return chunks

def process_input(source: str) -> list:
    """
    Extracts and normalizes audio chunks from an uploaded local media file.
    """
    print(f"[AudioProcessor] Processing local file: {source}")
    audio_path = convert_to_wav(source)
    print(f"[AudioProcessor] Chunking audio file: {audio_path}")
    chunks = chunk_audio(audio_path)
    print(f"[AudioProcessor] Audio Ready - {len(chunks)} chunk(s) created.")
    return chunks