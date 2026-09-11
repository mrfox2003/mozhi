import asyncio
import re
from pathlib import Path
from typing import Optional, List, Dict, Tuple
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


def sanitize_filename(name: str) -> str:
    """Sanitize section name for safe filename creation."""
    clean = re.sub(r'[\\/*?:"<>|]', "", name).strip()
    return clean if clean else "section"


def parse_script_sections(content: str) -> List[Tuple[str, str]]:
    """
    Parse a script into named sections delimited by lines starting with '# <name>'.
    
    Example:
        # Intro
        Hello everyone.
        
        # Basics
        Let's cover the basics.
        
    Returns:
        List of tuples: [(section_name, section_text), ...]
    """
    lines = content.splitlines()
    sections: List[Tuple[str, str]] = []
    current_name: Optional[str] = None
    current_buffer: List[str] = []

    for line in lines:
        stripped = line.strip()
        # Check if line starts with header marker '#'
        if stripped.startswith("#"):
            # Header found - save previous section if it had content
            if current_buffer and (current_name or any(current_buffer)):
                text = "\n".join(current_buffer).strip()
                if text:
                    sec_name = current_name if current_name else "intro"
                    sections.append((sanitize_filename(sec_name), text))
                current_buffer = []

            # Extract header name after '#' characters
            header_title = stripped.lstrip("#").strip()
            current_name = header_title if header_title else "section"
        else:
            current_buffer.append(line)

    # Flush last section
    if current_buffer:
        text = "\n".join(current_buffer).strip()
        if text:
            sec_name = current_name if current_name else "speech"
            sections.append((sanitize_filename(sec_name), text))

    # If no headers were used, treat whole content as 'speech'
    if not sections and content.strip():
        sections.append(("speech", content.strip()))

    return sections


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
    """Synchronous entry point for single audio generation."""
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


async def synthesize_sections_async(
    sections: List[Tuple[str, str]],
    output_dir: Path,
    voice: str = DEFAULT_VOICE,
    rate: str = DEFAULT_RATE,
    pitch: str = DEFAULT_PITCH,
    volume: str = DEFAULT_VOLUME,
) -> List[Path]:
    """Generate audio files for multiple sections."""
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    generated_paths: List[Path] = []

    for name, text in sections:
        file_path = output_dir / f"{name}.mp3"
        await synthesize_speech_async(
            text=text,
            output_path=file_path,
            voice=voice,
            rate=rate,
            pitch=pitch,
            volume=volume,
        )
        generated_paths.append(file_path)

    return generated_paths


def generate_from_file(
    input_file: Path,
    output_target: Path,
    voice: str = DEFAULT_VOICE,
    rate: str = DEFAULT_RATE,
    pitch: str = DEFAULT_PITCH,
    volume: str = DEFAULT_VOLUME,
) -> List[Path]:
    """
    Read script file, automatically detect sections, and synthesize speech.
    Returns list of generated file paths.
    """
    input_file = Path(input_file)
    if not input_file.exists():
        raise FileNotFoundError(f"Script file '{input_file}' not found.")

    text = input_file.read_text(encoding="utf-8")
    sections = parse_script_sections(text)

    if not sections:
        raise ValueError("Script is empty. Please add text to generate speech.")

    # If target is a directory or if multiple sections exist
    output_target = Path(output_target)
    if len(sections) == 1 and not output_target.is_dir() and output_target.suffix.lower() == ".mp3":
        # Single section and specific mp3 output requested
        path = generate_speech(
            text=sections[0][1],
            output_path=output_target,
            voice=voice,
            rate=rate,
            pitch=pitch,
            volume=volume,
        )
        return [path]

    out_dir = output_target if output_target.is_dir() or output_target.suffix == "" else output_target.parent
    return asyncio.run(
        synthesize_sections_async(
            sections=sections,
            output_dir=out_dir,
            voice=voice,
            rate=rate,
            pitch=pitch,
            volume=volume,
        )
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

