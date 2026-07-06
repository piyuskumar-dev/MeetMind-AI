import os
import yt_dlp
from pydub import AudioSegment

OUTPUT_DIR = "downloads"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def download_audio_from_youtube(url: str) -> str:
    ydl_opts = {
        "format": "bestaudio",
        "outtmpl": os.path.join(OUTPUT_DIR, "%(title)s.%(ext)s"),
        "ffmpeg_location": "/opt/homebrew/bin",
        "noplaylist": True,
        "quiet": False,
        "postprocessors": [
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": "wav",
            }
        ],
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        filename = ydl.prepare_filename(info)
        return os.path.splitext(filename)[0] + ".wav"

# data = (download_audio_from_youtube("https://youtu.be/mtiOK2QG9Q0?si=b6Q7PykbwPHO-hcy"))

def convert_to_wav(input_file: str) -> None:
    output_file = os.path.splitext(input_file)[0] + "_converted.wav"
    audio = AudioSegment.from_file(input_file)
    audio = audio.set_channels(1)  # Convert to mono
    audio = audio.set_frame_rate(16000)  # Set sample rate to 16kHz
    audio.export(output_file, format="wav")
    return output_file

# data_path = convert_to_wav(data)

def chunk_audio(wav_path: str, chunk_length_ms: int = 10) -> list:
    audio = AudioSegment.from_file(wav_path)
    chunk_ms = chunk_length_ms * 60 * 1000  # Convert milliseconds to microseconds
    chunks = []
    for i,start in enumerate(range(0, len(audio), chunk_ms)):
        chunk = audio[start : start + chunk_ms]
        chunk_path = f"{wav_path}_chunk_{i}.wav"
        chunk.export(chunk_path, format="wav")

        chunks.append(chunk_path)
    return chunks

def process_input(source: str) -> list:
    if source.startswith("http://") or source.startswith("https://"):
        print(f"Downloading audio from YouTube URL: {source}")
        audio_path = download_audio_from_youtube(source)
    else:
        print(f"Using local audio file: {source}")
        audio_path = convert_to_wav(source)

    print(f"Chunking audio file: {audio_path}")
    chunks = chunk_audio(audio_path)
    print(f"Audio Ready - {len(chunks)} chunk(s) created.")
    return chunks

# print(process_input("https://youtu.be/mtiOK2QG9Q0?si=b6Q7PykbwPHO-hcy"))