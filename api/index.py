import io
import json
import re
import asyncio
import urllib.parse
from http.server import BaseHTTPRequestHandler
import edge_tts

DEFAULT_VOICE = "en-US-JennyNeural"
DEFAULT_RATE = "+0%"
DEFAULT_PITCH = "+0Hz"
DEFAULT_VOLUME = "+0%"
WORDS_PER_MINUTE = 140

PRESET_VOICES = {
    "us-female": "en-US-JennyNeural",
    "us-male": "en-US-GuyNeural",
    "us-narrator": "en-US-AriaNeural",
    "in-female": "en-IN-NeerjaNeural",
    "in-male": "en-IN-PrabhatNeural",
    "uk-female": "en-GB-SoniaNeural",
    "uk-male": "en-GB-RyanNeural",
    "uk-libby": "en-GB-LibbyNeural",
    "uk-maisie": "en-GB-MaisieNeural",
    "uk-thomas": "en-GB-ThomasNeural",
    "ta-female": "ta-IN-PallaviNeural",
    "ta-male": "ta-IN-ValluvarNeural",
}

AUDITION_CACHE = {}


def resolve_voice(v: str) -> str:
    return PRESET_VOICES.get(v.lower(), v) if v else DEFAULT_VOICE


def sanitize_filename(name: str) -> str:
    clean = re.sub(r'[\\/*?:"<>|]', "", name).strip()
    return clean if clean else "section"


def parse_script_sections(content: str):
    lines = content.splitlines()
    sections = []
    current_name = None
    current_buffer = []

    for line in lines:
        stripped = line.strip()
        if stripped.startswith("#"):
            if current_name or any(current_buffer):
                text = "\n".join(current_buffer).strip()
                if not text and current_name:
                    text = current_name
                if text:
                    sec_name = current_name if current_name else "intro"
                    sections.append((sanitize_filename(sec_name), text))
                current_buffer = []
            header_title = stripped.lstrip("#").strip()
            current_name = header_title if header_title else "section"
        else:
            current_buffer.append(line)

    if current_name or any(current_buffer):
        text = "\n".join(current_buffer).strip()
        if not text and current_name:
            text = current_name
        if text:
            sec_name = current_name if current_name else "speech"
            sections.append((sanitize_filename(sec_name), text))

    if not sections and content.strip():
        sections.append(("speech", content.strip()))

    return sections


async def synthesize_bytes(text: str, voice: str, rate: str, pitch: str, volume: str) -> bytes:
    resolved = resolve_voice(voice)
    communicate = edge_tts.Communicate(
        text=text,
        voice=resolved,
        rate=rate,
        pitch=pitch,
        volume=volume,
    )
    buffer = io.BytesIO()
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            buffer.write(chunk["data"])
    return buffer.getvalue()


class handler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Cache-Control, Pragma, Authorization, *")
        self.send_header("Access-Control-Expose-Headers", "X-Voice-Used, X-Audio-Duration, X-Timeline-Sec, X-Size-Kb")

    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        if path.endswith("/api/voices"):
            try:
                raw_voices = asyncio.run(edge_tts.list_voices())
                formatted = [
                    {
                        "id": v.get("ShortName", ""),
                        "name": v.get("FriendlyName", v.get("ShortName", "")),
                        "gender": v.get("Gender", "Unknown"),
                        "locale": v.get("Locale", "Unknown"),
                    }
                    for v in raw_voices
                ]
                resp_data = json.dumps({"presets": PRESET_VOICES, "voices": formatted}).encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Cache-Control", "public, max-age=3600")
                self._send_cors_headers()
                self.end_headers()
                self.wfile.write(resp_data)
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self._send_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
            return

        elif path.endswith("/api/audition"):
            voice = query.get("voice", [DEFAULT_VOICE])[0]
            speed = query.get("speed", [DEFAULT_RATE])[0]
            voice_id = resolve_voice(voice)
            cache_key = f"{voice_id}_{speed}"

            if cache_key in AUDITION_CACHE:
                audio_bytes = AUDITION_CACHE[cache_key]
            else:
                display_name = voice_id.split("-")[-1].replace("Neural", "") if "-" in voice_id else voice_id
                text = f"Hello! This is {display_name}. Welcome to Mozhi Studio."
                loc = voice_id.lower()
                if "ta-in" in loc:
                    text = f"வணக்கம், இது {display_name}. மொழி ஸ்டுடியோவிற்கு உங்களை அன்புடன் வரவேற்கிறோம்."
                elif "hi-in" in loc:
                    text = f"नमस्ते, मैं {display_name} हूँ। मोझी स्टूडियो में आपका स्वागत है।"
                elif "fr-fr" in loc or "fr-ca" in loc:
                    text = f"Bonjour, je m'appelle {display_name}. Bienvenue sur Mozhi Studio."
                elif "de-de" in loc:
                    text = f"Hallo, hier ist {display_name}. Willkommen bei Mozhi Studio."
                elif "es-es" in loc or "es-mx" in loc:
                    text = f"Hola, soy {display_name}. Bienvenidos a Mozhi Studio."
                elif "ja-jp" in loc:
                    text = f"こんにちは、{display_name}です。Mozhi Studioへようこそ。"
                elif "zh-cn" in loc:
                    text = f"你好，我是{display_name}。欢迎来到Mozhi Studio。"

                try:
                    audio_bytes = asyncio.run(
                        synthesize_bytes(text, voice_id, speed, "+0Hz", "+0%")
                    )
                    AUDITION_CACHE[cache_key] = audio_bytes
                except Exception as e:
                    self.send_response(500)
                    self.send_header("Content-Type", "application/json")
                    self._send_cors_headers()
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
                    return

            self.send_response(200)
            self.send_header("Content-Type", "audio/mpeg")
            self.send_header("Cache-Control", "public, max-age=3600")
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(audio_bytes)
            return

        self.send_response(404)
        self.send_header("Content-Type", "application/json")
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps({"error": "Endpoint not found"}).encode("utf-8"))

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        content_length = int(self.headers.get("Content-Length", 0))
        post_body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"
        try:
            data = json.loads(post_body)
        except Exception:
            data = {}

        if path.endswith("/api/tts"):
            text = data.get("text", "").strip()
            if not text:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self._send_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Text is required"}).encode("utf-8"))
                return

            voice = data.get("voice", DEFAULT_VOICE)
            rate = data.get("rate", DEFAULT_RATE)
            pitch = data.get("pitch", DEFAULT_PITCH)
            volume = data.get("volume", DEFAULT_VOLUME)
            resolved_voice = resolve_voice(voice)

            try:
                audio_bytes = asyncio.run(
                    synthesize_bytes(text, resolved_voice, rate, pitch, volume)
                )
                size_kb = round(len(audio_bytes) / 1024, 1)
                words = [w for w in text.split() if w.strip()]
                est_dur = round(size_kb / 16.0, 1) if size_kb > 0 else round(len(words) * 0.43, 1)
                rec_timeline = round(est_dur + 0.8, 1)

                self.send_response(200)
                self.send_header("Content-Type", "audio/mpeg")
                self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
                self.send_header("Pragma", "no-cache")
                self.send_header("Expires", "0")
                self.send_header("X-Voice-Used", resolved_voice)
                self.send_header("X-Audio-Duration", str(est_dur))
                self.send_header("X-Timeline-Sec", str(rec_timeline))
                self.send_header("X-Size-Kb", str(size_kb))
                self._send_cors_headers()
                self.end_headers()
                self.wfile.write(audio_bytes)
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self._send_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
            return

        elif path.endswith("/api/parse-sections"):
            script = data.get("script", "")
            raw_sections = parse_script_sections(script)
            sections_data = []
            total_words = 0
            for name, text in raw_sections:
                words = [w for w in text.split() if w.strip()]
                count = len(words)
                total_words += count
                est_sec = round((count / WORDS_PER_MINUTE) * 60, 1)
                sections_data.append({
                    "name": name,
                    "text": text,
                    "word_count": count,
                    "est_duration_sec": est_sec,
                })
            total_est = round((total_words / WORDS_PER_MINUTE) * 60, 1)
            resp = {
                "total_sections": len(sections_data),
                "total_words": total_words,
                "estimated_duration_sec": total_est,
                "sections": sections_data,
            }
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps(resp).encode("utf-8"))
            return

        self.send_response(404)
        self.send_header("Content-Type", "application/json")
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps({"error": "Endpoint not found"}).encode("utf-8"))
