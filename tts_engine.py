import asyncio
from pathlib import Path
from typing import Optional, List, Dict
import edge_tts
from config import (
    DEFAULT_VOICE,
    DEFAULT_RATE,
    DEFAULT_PITCH,
    DEFAULT_VOLUME,
    PRESET_VOICES,
    DEFAULT_OUTPUT_DIR,
)


def resolve_voice(voice_or_preset: str) -> str:
    """Resolve preset shorthand name to full voice identifier if applicable."""
    return PRESET_VOICES.get(voice_or_preset.lower(), voice_or_preset)


async def synthesize_speech_async(
    text: str,
    output_path: Path,
    voice: str = DEFAULT_VOICE,
    rate: str = DEFAULT_RATE,
    pitch: str = DEFAULT_PITCH,
    volume: str = DEFAULT_VOLUME,
) -> Path:
    """Generate audio file from input text asynchronously."""
    clean_text = text.strip()
    if not clean_text:
        raise ValueError("Script is empty. Please add text to generate speech.")

    resolved_voice = resolve_voice(voice)
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    communicate = edge_tts.Communicate(
        text=clean_text,
        voice=resolved_voice,
        rate=rate,
        pitch=pitch,
        volume=volume,
    )
    await communicate.save(str(output_path))
    return output_path


def generate_speech(
    text: str,
    output_path: Path,
    voice: str = DEFAULT_VOICE,
    rate: str = DEFAULT_RATE,
    pitch: str = DEFAULT_PITCH,
    volume: str = DEFAULT_VOLUME,
) -> Path:
    """Synchronous entry point for audio generation."""
    return asyncio.run(
        synthesize_speech_async(
            text=text,
            output_path=output_path,
            voice=voice,
            rate=rate,
            pitch=pitch,
            volume=volume,
        )
    )


def generate_from_file(
    input_file: Path,
    output_path: Path,
    voice: str = DEFAULT_VOICE,
    rate: str = DEFAULT_RATE,
    pitch: str = DEFAULT_PITCH,
    volume: str = DEFAULT_VOLUME,
) -> Path:
    """Read script file and synthesize speech."""
    input_file = Path(input_file)
    if not input_file.exists():
        raise FileNotFoundError(f"Script file '{input_file}' not found.")

    text = input_file.read_text(encoding="utf-8")
    return generate_speech(
        text=text,
        output_path=output_path,
        voice=voice,
        rate=rate,
        pitch=pitch,
        volume=volume,
    )


async def fetch_available_voices(language_prefix: Optional[str] = None) -> List[Dict]:
    """Fetch available neural voices from Edge TTS."""
    voices = await edge_tts.list_voices()
    if language_prefix:
        prefix = language_prefix.lower()
        voices = [
            v for v in voices
            if v.get("Locale", "").lower().startswith(prefix)
            or prefix in v.get("ShortName", "").lower()
        ]
    return voices


def list_voices(language_prefix: Optional[str] = None) -> List[Dict]:
    """Synchronously retrieve available voices."""
    return asyncio.run(fetch_available_voices(language_prefix))
