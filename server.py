import io
import json
import time
import uuid
import urllib.parse
import zipfile
from pathlib import Path
from aiohttp import web
import aiohttp_cors
import edge_tts

from config import (
    DEFAULT_OUTPUT_DIR,
    DEFAULT_VOICE,
    DEFAULT_RATE,
    DEFAULT_PITCH,
    DEFAULT_VOLUME,
    PRESET_VOICES,
    CLEAN_OUTPUT_ON_RUN,
)
from tts_engine import (
    parse_script_sections,
    synthesize_speech_async,
    synthesize_speech_bytes_async,
    fetch_available_voices,
    clean_output_directory,
    resolve_voice,
    sanitize_filename,
)

# Estimate word count duration (avg 140 WPM => 0.428 sec/word)
WORDS_PER_MINUTE = 140

# In-memory fast cache for neural voice audition snippets
AUDITION_CACHE: dict = {}


async def handle_tts(request: web.Request) -> web.Response:
    """100% Stateless speech synthesis endpoint. Returns raw MP3 bytes directly (0 disk I/O)."""
    try:
        data = await request.json()
        text = data.get("text", "").strip()
        if not text:
            return web.json_response({"error": "Speech text is required."}, status=400)

        voice = data.get("voice", DEFAULT_VOICE)
        rate = data.get("rate", DEFAULT_RATE)
        pitch = data.get("pitch", DEFAULT_PITCH)
        volume = data.get("volume", DEFAULT_VOLUME)
        resolved_voice = resolve_voice(voice)

        audio_bytes = await synthesize_speech_bytes_async(
            text=text,
            voice=resolved_voice,
            rate=rate,
            pitch=pitch,
            volume=volume,
        )

        size_kb = round(len(audio_bytes) / 1024, 1)
        w_count, _ = calculate_metrics(text)
        est_duration = round(size_kb / 16.0, 1) if size_kb > 0 else round(w_count * 0.43, 1)
        rec_timeline = round(est_duration + 0.8, 1)

        return web.Response(
            body=audio_bytes,
            headers={
                "Content-Type": "audio/mpeg",
                "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
                "Pragma": "no-cache",
                "Expires": "0",
                "X-Voice-Used": resolved_voice,
                "X-Audio-Duration": str(est_duration),
                "X-Timeline-Sec": str(rec_timeline),
                "X-Size-Kb": str(size_kb),
            },
        )
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)


def calculate_metrics(text: str):
    words = [w for w in text.split() if w.strip()]
    count = len(words)
    est_sec = round((count / WORDS_PER_MINUTE) * 60, 1)
    return count, est_sec


async def handle_audition(request: web.Request) -> web.Response:
    """Synthesize or stream a live real neural voice audition sample with native language support."""
    try:
        voice = request.query.get("voice", DEFAULT_VOICE)
        speed = request.query.get("speed", DEFAULT_RATE)
        voice_id = resolve_voice(voice)
        cache_key = f"{voice_id}_{speed}"

        if cache_key in AUDITION_CACHE:
            return web.Response(
                body=AUDITION_CACHE[cache_key],
                headers={"Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=3600"},
            )

        # Extract voice friendly name
        display_name = voice_id.split("-")[-1].replace("Neural", "") if "-" in voice_id else voice_id
        text = f"Hello! This is {display_name}. Welcome to Mozhi Studio."

        locale_lower = voice_id.lower()
        if "ta-in" in locale_lower:
            text = f"வணக்கம், இது {display_name}. மொழி ஸ்டுடியோவிற்கு உங்களை அன்புடன் வரவேற்கிறோம்."
        elif "hi-in" in locale_lower:
            text = f"नमस्ते, मैं {display_name} हूँ। मोझी स्टूडियो में आपका स्वागत है।"
        elif "fr-fr" in locale_lower or "fr-ca" in locale_lower:
            text = f"Bonjour, je m'appelle {display_name}. Bienvenue sur Mozhi Studio."
        elif "de-de" in locale_lower:
            text = f"Hallo, hier ist {display_name}. Willkommen bei Mozhi Studio."
        elif "es-es" in locale_lower or "es-mx" in locale_lower:
            text = f"Hola, soy {display_name}. Bienvenidos a Mozhi Studio."
        elif "ja-jp" in locale_lower:
            text = f"こんにちは、{display_name}です。Mozhi Studioへようこそ。"
        elif "zh-cn" in locale_lower or "zh-hk" in locale_lower:
            text = f"你好，我是{display_name}。欢迎来到Mozhi Studio。"

        communicate = edge_tts.Communicate(
            text=text,
            voice=voice_id,
            rate=speed,
        )
        audio_buffer = io.BytesIO()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_buffer.write(chunk["data"])

        audio_bytes = audio_buffer.getvalue()
        AUDITION_CACHE[cache_key] = audio_bytes

        return web.Response(
            body=audio_bytes,
            headers={"Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=3600"},
        )
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)


async def handle_voices(request: web.Request) -> web.Response:
    """Return available preset voices and full voice catalog."""
    try:
        raw_voices = await fetch_available_voices()
        formatted = []
        for v in raw_voices:
            formatted.append({
                "id": v.get("ShortName", ""),
                "name": v.get("FriendlyName", v.get("ShortName", "")),
                "gender": v.get("Gender", "Unknown"),
                "locale": v.get("Locale", "Unknown"),
            })
        return web.json_response({
            "presets": PRESET_VOICES,
            "voices": formatted,
        })
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)


async def handle_parse_sections(request: web.Request) -> web.Response:
    """Parse script into sections with live telemetry."""
    try:
        data = await request.json()
        script = data.get("script", "")
        raw_sections = parse_script_sections(script)

        sections_data = []
        total_words = 0

        for name, text in raw_sections:
            w_count, est_sec = calculate_metrics(text)
            total_words += w_count
            sections_data.append({
                "name": name,
                "text": text,
                "word_count": w_count,
                "est_duration_sec": est_sec,
            })

        total_est = round((total_words / WORDS_PER_MINUTE) * 60, 1)
        return web.json_response({
            "total_sections": len(sections_data),
            "total_words": total_words,
            "estimated_duration_sec": total_est,
            "sections": sections_data,
        })
    except Exception as e:
        return web.json_response({"error": str(e)}, status=400)


async def handle_generate(request: web.Request) -> web.Response:
    """Synthesize speech audio for all script sections."""
    start_time = time.time()
    try:
        data = await request.json()
        script = data.get("script", "").strip()
        if not script:
            return web.json_response({"error": "Script content is empty."}, status=400)

        voice = data.get("voice", DEFAULT_VOICE)
        rate = data.get("rate", DEFAULT_RATE)
        pitch = data.get("pitch", DEFAULT_PITCH)
        volume = data.get("volume", DEFAULT_VOLUME)
        should_clean = data.get("clean_output", CLEAN_OUTPUT_ON_RUN)

        sections = parse_script_sections(script)
        if not sections:
            return web.json_response({"error": "No valid sections found in script."}, status=400)

        DEFAULT_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        clean_output_directory(DEFAULT_OUTPUT_DIR)

        ts = int(time.time() * 1000)
        batch_id = uuid.uuid4().hex[:8]
        generated_files = []
        for i, (name, text) in enumerate(sections):
            file_path = DEFAULT_OUTPUT_DIR / f"{name}.mp3"
            if file_path.exists():
                try:
                    file_path.unlink()
                except OSError:
                    pass

            await synthesize_speech_async(
                text=text,
                output_path=file_path,
                voice=voice,
                rate=rate,
                pitch=pitch,
                volume=volume,
            )

            size_kb = round(file_path.stat().st_size / 1024, 1)
            # Estimate audio duration from word count or file size (128kbps = 16KB/s)
            w_count, _ = calculate_metrics(text)
            est_duration = round(size_kb / 16.0, 1) if size_kb > 0 else round(w_count * 0.43, 1)
            recommended_timeline = round(est_duration + 0.8, 1)

            encoded_name = urllib.parse.quote(name)
            generated_files.append({
                "sectionName": name,
                "filename": f"{name}.mp3",
                "audioUrl": f"/api/audio/{encoded_name}.mp3?t={ts}_{batch_id}_{i}",
                "sizeKb": size_kb,
                "durationSec": est_duration,
                "recommendedTimelineSec": recommended_timeline,
            })

        elapsed = round(time.time() - start_time, 2)
        return web.json_response({
            "success": True,
            "elapsedSeconds": elapsed,
            "files": generated_files,
        })
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)


async def handle_generate_single(request: web.Request) -> web.Response:
    """Surgically re-generate or update a single slide audio track."""
    try:
        data = await request.json()
        section_name = sanitize_filename(data.get("section_name", "slide"))
        text = data.get("text", "").strip()
        if not text:
            text = section_name

        voice = data.get("voice", DEFAULT_VOICE)
        rate = data.get("rate", DEFAULT_RATE)
        pitch = data.get("pitch", DEFAULT_PITCH)
        volume = data.get("volume", DEFAULT_VOLUME)

        DEFAULT_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        file_path = DEFAULT_OUTPUT_DIR / f"{section_name}.mp3"
        if file_path.exists():
            try:
                file_path.unlink()
            except OSError:
                pass

        await synthesize_speech_async(
            text=text,
            output_path=file_path,
            voice=voice,
            rate=rate,
            pitch=pitch,
            volume=volume,
        )

        size_kb = round(file_path.stat().st_size / 1024, 1)
        w_count, _ = calculate_metrics(text)
        est_duration = round(size_kb / 16.0, 1) if size_kb > 0 else round(w_count * 0.43, 1)
        recommended_timeline = round(est_duration + 0.8, 1)
        ts = int(time.time() * 1000)
        single_id = uuid.uuid4().hex[:8]
        encoded_name = urllib.parse.quote(section_name)

        return web.json_response({
            "success": True,
            "file": {
                "sectionName": section_name,
                "filename": f"{section_name}.mp3",
                "audioUrl": f"/api/audio/{encoded_name}.mp3?t={ts}_{single_id}",
                "sizeKb": size_kb,
                "durationSec": est_duration,
                "recommendedTimelineSec": recommended_timeline,
            },
        })
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)


async def handle_audio_stream(request: web.Request) -> web.FileResponse:
    """Stream an MP3 file from the output directory for browser audio playback."""
    raw_filename = request.match_info.get("filename", "")
    filename = urllib.parse.unquote(raw_filename)
    file_path = DEFAULT_OUTPUT_DIR / filename
    if not file_path.exists() or not file_path.is_file():
        file_path = DEFAULT_OUTPUT_DIR / raw_filename

    if not file_path.exists() or not file_path.is_file():
        raise web.HTTPNotFound(text=f"Audio file '{filename}' not found.")

    return web.FileResponse(
        file_path,
        headers={
            "Content-Type": "audio/mpeg",
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0, post-check=0, pre-check=0",
            "Pragma": "no-cache",
            "Expires": "0",
            "Accept-Ranges": "bytes",
            "Access-Control-Allow-Origin": "*",
        },
    )


async def handle_download_zip(request: web.Request) -> web.Response:
    """Package all generated MP3 files and timeline specs into a zip download."""
    if not DEFAULT_OUTPUT_DIR.exists():
        raise web.HTTPNotFound(text="No audio output directory found.")

    mp3_files = sorted(list(DEFAULT_OUTPUT_DIR.glob("*.mp3")))
    if not mp3_files:
        raise web.HTTPNotFound(text="No generated audio files found to export.")

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        # Add audio tracks
        csv_rows = ["Slide Name,Filename,Audio Duration (s),Recommended Storyline Timeline (s),File Size (KB)"]
        readme_lines = [
            "============================================================",
            "🎙️  MOZHI STUDIO - COURSE AUDIOVOICE EXPORT",
            "============================================================",
            "",
            "SLIDE TIMELINE SPECIFICATIONS FOR ARTICULATE STORYLINE / RISE 360:",
            "------------------------------------------------------------",
        ]

        for audio_file in mp3_files:
            zip_file.write(audio_file, arcname=audio_file.name)
            size_kb = round(audio_file.stat().st_size / 1024, 1)
            est_duration = round(size_kb / 16.0, 1) if size_kb > 0 else 5.0
            rec_timeline = round(est_duration + 0.8, 1)
            section_name = audio_file.stem

            csv_rows.append(f'"{section_name}","{audio_file.name}",{est_duration},{rec_timeline},{size_kb}')
            readme_lines.append(f"• {section_name}: Duration {est_duration}s | Recommended Storyline Timeline: {rec_timeline}s ({audio_file.name})")

        readme_lines.append("")
        readme_lines.append("Tip: In Articulate Storyline, set your slide timeline duration to the 'Recommended Storyline Timeline' to provide natural pacing after speech.")

        # Write metadata files into ZIP
        zip_file.writestr("storyline_timelines.csv", "\n".join(csv_rows))
        zip_file.writestr("TIMELINE_SPECS.txt", "\n".join(readme_lines))

    zip_buffer.seek(0)
    return web.Response(
        body=zip_buffer.getvalue(),
        headers={
            "Content-Type": "application/zip",
            "Content-Disposition": 'attachment; filename="mozhi_course_audio.zip"',
        },
    )


def create_app() -> web.Application:
    app = web.Application()

    # Configure CORS for local development
    cors = aiohttp_cors.setup(app, defaults={
        "*": aiohttp_cors.ResourceOptions(
            allow_credentials=True,
            expose_headers="*",
            allow_headers="*",
        )
    })

    # Register API routes
    r_voices = app.router.add_get("/api/voices", handle_voices)
    r_audition = app.router.add_get("/api/audition", handle_audition)
    r_parse = app.router.add_post("/api/parse-sections", handle_parse_sections)
    r_tts = app.router.add_post("/api/tts", handle_tts)
    r_gen = app.router.add_post("/api/generate", handle_generate)
    r_single = app.router.add_post("/api/generate-single", handle_generate_single)
    r_audio = app.router.add_get("/api/audio/{filename}", handle_audio_stream)
    r_zip = app.router.add_get("/api/download-zip", handle_download_zip)

    for route in [r_voices, r_audition, r_parse, r_tts, r_gen, r_single, r_audio, r_zip]:
        cors.add(route)

    dist_dir = Path(__file__).resolve().parent / "dist"

    async def handle_index(request: web.Request) -> web.FileResponse:
        index_file = dist_dir / "index.html"
        if index_file.exists():
            return web.FileResponse(index_file)
        return web.Response(
            text="Mozhi Studio API is active. Build the frontend with 'npm run build' to serve the UI here.",
            content_type="text/plain",
        )

    # Static assets
    if dist_dir.exists():
        assets_dir = dist_dir / "assets"
        if assets_dir.exists():
            app.router.add_static("/assets", path=str(assets_dir), name="assets")
        fav = dist_dir / "favicon.svg"
        if fav.exists():
            app.router.add_get("/favicon.svg", lambda req: web.FileResponse(fav))

    app.router.add_get("/", handle_index)

    return app


if __name__ == "__main__":
    app = create_app()
    print("\n" + "=" * 60)
    print("🎙️  MOZHI STUDIO API SERVER")
    print("=" * 60)
    print("Listening on: http://127.0.0.1:8000")
    print("API Base    : http://127.0.0.1:8000/api")
    print("=" * 60 + "\n")
    web.run_app(app, host="127.0.0.1", port=8000)
