from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent
DEFAULT_SCRIPT_FILE = BASE_DIR / "script.txt"
DEFAULT_OUTPUT_DIR = BASE_DIR / "output"
DEFAULT_OUTPUT_FILE = DEFAULT_OUTPUT_DIR / "speech.mp3"

# Voice Settings
# Default: High-quality natural neural voice
DEFAULT_VOICE = "en-US-JennyNeural"

# Voice speed, pitch, and volume adjustments
# Rate format: "+0%", "+10%", "-5%"
# Pitch format: "+0Hz", "+5Hz", "-5Hz"
# Volume format: "+0%", "+10%", "-10%"
DEFAULT_RATE = "+0%"
DEFAULT_PITCH = "+0Hz"
DEFAULT_VOLUME = "+0%"

# Quick preset voices for e-learning content
PRESET_VOICES = {
    # English - US
    "us-female": "en-US-JennyNeural",
    "us-male": "en-US-GuyNeural",
    "us-narrator": "en-US-AriaNeural",
    
    # English - India
    "in-female": "en-IN-NeerjaNeural",
    "in-male": "en-IN-PrabhatNeural",
    
    # English - UK
    "uk-female": "en-GB-SoniaNeural",
    "uk-male": "en-GB-RyanNeural",
    
    # Tamil (Mozhi)
    "ta-female": "ta-IN-PallaviNeural",
    "ta-male": "ta-IN-ValluvarNeural",
}
