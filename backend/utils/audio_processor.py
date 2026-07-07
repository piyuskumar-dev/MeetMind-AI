import os
import subprocess
import uuid

OUTPUT_DIR = "downloads"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def process_input(source: str, chunk_length_min: int = 10) -> list:
    """
    Extracts and normalizes audio chunks from an uploaded local media file.
    Uses ffmpeg directly to avoid loading entire audio into memory.
    """
    print(f"[AudioProcessor] Processing local file: {source}")
    
    # Create a unique directory for the chunks of this process run to avoid collisions
    process_id = str(uuid.uuid4())
    chunks_dir = os.path.join(OUTPUT_DIR, f"chunks_{process_id}")
    os.makedirs(chunks_dir, exist_ok=True)
    
    # Output template for ffmpeg segment format
    # Example: downloads/chunks_uuid/chunk_%03d.wav
    output_template = os.path.join(chunks_dir, "chunk_%03d.wav")
    segment_time_seconds = chunk_length_min * 60
    
    # ffmpeg command to extract audio, downsample to 16kHz mono, and split into segments
    cmd = [
        "ffmpeg", "-y",
        "-i", source,
        "-f", "segment",
        "-segment_time", str(segment_time_seconds),
        "-c:a", "pcm_s16le",
        "-ac", "1",
        "-ar", "16000",
        output_template
    ]
    
    print(f"[AudioProcessor] Running ffmpeg command: {' '.join(cmd)}")
    try:
        # Run command capturing stderr to print in case of failure
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
        print("[AudioProcessor] ffmpeg command executed successfully.")
    except subprocess.CalledProcessError as e:
        print(f"[AudioProcessor] ffmpeg command failed with code {e.returncode}")
        print(f"[AudioProcessor] stderr: {e.stderr}")
        raise RuntimeError(f"Audio processing failed: {e.stderr}")
    
    # Get all chunk files and sort them to return in correct chronological order
    if not os.path.exists(chunks_dir):
        return []
        
    chunk_files = [
        os.path.join(chunks_dir, f)
        for f in os.listdir(chunks_dir)
        if f.endswith(".wav")
    ]
    chunk_files.sort()
    
    print(f"[AudioProcessor] Audio Ready - {len(chunk_files)} chunk(s) created.")
    return chunk_files