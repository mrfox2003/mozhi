import argparse
import sys
import time
from pathlib import Path

from config import (
    DEFAULT_SCRIPT_FILE,
    DEFAULT_OUTPUT_FILE,
    DEFAULT_VOICE,
    DEFAULT_RATE,
    DEFAULT_PITCH,
    DEFAULT_VOLUME,
    PRESET_VOICES,
)
from tts_engine import generate_from_file, list_voices, resolve_voice


def display_presets():
    """Print available quick preset voice aliases."""
    print("\nAvailable Quick Preset Voices:")
    print("-" * 50)
    for alias, voice_id in PRESET_VOICES.items():
        print(f"  {alias:<15} -> {voice_id}")
    print("-" * 50)


def print_voice_list(lang_filter: str = None):
    """Print all available voices matching filter."""
    print(f"\nFetching available voices{f' for filter: {lang_filter}' if lang_filter else ''}...")
    voices = list_voices(lang_filter)
    if not voices:
        print("No voices found matching the criteria.")
        return

    print(f"\n{'Voice ID (ShortName)':<35} {'Gender':<10} {'Locale':<12}")
    print("=" * 60)
    for v in sorted(voices, key=lambda x: x.get("ShortName", "")):
        short_name = v.get("ShortName", "")
        gender = v.get("Gender", "")
        locale = v.get("Locale", "")
        print(f"{short_name:<35} {gender:<10} {locale:<12}")
    print(f"\nTotal voices: {len(voices)}")


def run_conversion(
    input_file: Path,
    output_file: Path,
    voice: str,
    rate: str,
    pitch: str,
    volume: str,
) -> bool:
    """Execute text-to-speech conversion for a file (supporting sections)."""
    try:
        resolved = resolve_voice(voice)
        start_time = time.time()
        print(f"Reading: {input_file}")
        print(f"Voice  : {resolved}")
        print(f"Rate   : {rate}")

        generated_files = generate_from_file(
            input_file=input_file,
            output_target=output_file,
            voice=resolved,
            rate=rate,
            pitch=pitch,
            volume=volume,
        )

        elapsed = time.time() - start_time
        print(f"\nGenerated {len(generated_files)} audio file(s) in {elapsed:.2f}s:")
        for path in generated_files:
            size_kb = path.stat().st_size / 1024
            print(f"  ✓ {path.name} -> {path} ({size_kb:.1f} KB)")
        print()
        return True
    except Exception as e:
        print(f"ERROR: {e}\n", file=sys.stderr)
        return False


def run_watch_mode(
    input_file: Path,
    output_file: Path,
    voice: str,
    rate: str,
    pitch: str,
    volume: str,
):
    """Watch script file for changes and regenerate audio on save."""
    print(f"Watching '{input_file}' for changes (Press Ctrl+C to stop)...")
    last_mtime = None

    if input_file.exists():
        last_mtime = input_file.stat().st_mtime
        run_conversion(input_file, output_file, voice, rate, pitch, volume)

    try:
        while True:
            time.sleep(1.0)
            if not input_file.exists():
                continue
            current_mtime = input_file.stat().st_mtime
            if last_mtime is None or current_mtime != last_mtime:
                last_mtime = current_mtime
                print(f"\nChange detected in {input_file.name}!")
                run_conversion(input_file, output_file, voice, rate, pitch, volume)
    except KeyboardInterrupt:
        print("\nWatch mode stopped.")


def main():
    parser = argparse.ArgumentParser(
        description="Mozhi - Voice generator for e-learning scripts"
    )
    parser.add_argument(
        "-f", "--file",
        type=Path,
        default=DEFAULT_SCRIPT_FILE,
        help=f"Path to input script file (default: {DEFAULT_SCRIPT_FILE.name})",
    )
    parser.add_argument(
        "-o", "--output",
        type=Path,
        default=DEFAULT_OUTPUT_FILE,
        help=f"Path to output audio file (default: {DEFAULT_OUTPUT_FILE})",
    )
    parser.add_argument(
        "-v", "--voice",
        type=str,
        default=DEFAULT_VOICE,
        help=f"Voice name or preset alias (default: {DEFAULT_VOICE})",
    )
    parser.add_argument(
        "-r", "--rate",
        type=str,
        default=DEFAULT_RATE,
        help="Speech speed adjustment, e.g., '+10%%', '-15%%' (default: +0%%)",
    )
    parser.add_argument(
        "--pitch",
        type=str,
        default=DEFAULT_PITCH,
        help="Speech pitch adjustment, e.g., '+5Hz', '-5Hz' (default: +0Hz)",
    )
    parser.add_argument(
        "--volume",
        type=str,
        default=DEFAULT_VOLUME,
        help="Speech volume adjustment, e.g., '+10%%', '-10%%' (default: +0%%)",
    )
    parser.add_argument(
        "-w", "--watch",
        action="store_true",
        help="Watch script.txt and automatically regenerate voice when saved",
    )
    parser.add_argument(
        "-l", "--list-voices",
        action="store_true",
        help="List available online neural voices",
    )
    parser.add_argument(
        "--lang",
        type=str,
        default=None,
        help="Filter voices by language prefix (e.g. 'en-US', 'en-IN', 'ta', 'es')",
    )
    parser.add_argument(
        "--presets",
        action="store_true",
        help="Show quick preset voice aliases",
    )

    args = parser.parse_args()

    if args.presets:
        display_presets()
        return

    if args.list_voices:
        print_voice_list(args.lang)
        return

    if args.watch:
        run_watch_mode(
            input_file=args.file,
            output_file=args.output,
            voice=args.voice,
            rate=args.rate,
            pitch=args.pitch,
            volume=args.volume,
        )
    else:
        success = run_conversion(
            input_file=args.file,
            output_file=args.output,
            voice=args.voice,
            rate=args.rate,
            pitch=args.pitch,
            volume=args.volume,
        )
        if not success:
            sys.exit(1)


if __name__ == "__main__":
    main()
