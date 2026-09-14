import type {
  VoicesResponse,
  GenerateResponse,
  GenerateSingleResponse,
  ParseResult,
  GeneratedFile,
} from '@/types';
import { ALL_VOICES, VOICE_PRESETS } from '@/data/voices';
import { parseScript } from '@/lib/scriptParser';

const API_BASE = '';

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchVoices(): Promise<VoicesResponse> {
  try {
    return await apiFetch<VoicesResponse>('/api/voices');
  } catch {
    // Fallback to local data when backend is unavailable
    const presets: Record<string, string> = {};
    for (const p of VOICE_PRESETS) presets[p.key] = p.voiceId;
    return { presets, voices: ALL_VOICES };
  }
}

export async function synthesizeSlideBlob(
  text: string,
  voice: string,
  rate: string,
  pitch = '+0Hz',
  volume = '+0%',
): Promise<{
  blob: Blob;
  sizeKb: number;
  durationSec: number;
  recommendedTimelineSec: number;
  voiceUsed?: string;
}> {
  const res = await fetch(`${API_BASE}/api/tts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
    },
    body: JSON.stringify({ text, voice, rate, pitch, volume }),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => res.statusText);
    throw new Error(`TTS Synthesis failed (${res.status}): ${errorText}`);
  }

  const blob = await res.blob();
  if (blob.size === 0) {
    throw new Error('Received empty audio payload from synthesis server.');
  }

  const sizeKb = parseFloat(res.headers.get('X-Size-Kb') || (blob.size / 1024).toFixed(1));
  const headerDuration = res.headers.get('X-Audio-Duration');
  const durationSec = headerDuration
    ? parseFloat(headerDuration)
    : Math.max(0.5, Math.round((blob.size / 16384) * 10) / 10);

  const headerTimeline = res.headers.get('X-Timeline-Sec');
  const recommendedTimelineSec = headerTimeline
    ? parseFloat(headerTimeline)
    : Math.round((durationSec + 0.8) * 10) / 10;

  const voiceUsed = res.headers.get('X-Voice-Used') || voice;

  return {
    blob,
    sizeKb,
    durationSec,
    recommendedTimelineSec,
    voiceUsed,
  };
}

export async function generateAudio(
  script: string,
  voice: string,
  rate: string,
): Promise<GenerateResponse> {
  const startTime = performance.now();
  const parseResult = parseScript(script);

  if (parseResult.sections.length === 0) {
    throw new Error('No valid slide sections found in script.');
  }

  // Synthesize all slides in parallel with stateless in-memory blobs
  const files: GeneratedFile[] = [];

  for (const section of parseResult.sections) {
    const result = await synthesizeSlideBlob(section.text, voice, rate);
    const audioUrl = window.URL.createObjectURL(result.blob);

    files.push({
      sectionName: section.name,
      filename: `${section.name}.mp3`,
      audioBlob: result.blob,
      audioUrl,
      voiceUsed: result.voiceUsed || voice,
      sizeKb: result.sizeKb,
      durationSec: result.durationSec,
      recommendedTimelineSec: result.recommendedTimelineSec,
    });
  }

  const elapsedSeconds = Math.round(((performance.now() - startTime) / 1000) * 10) / 10;
  return {
    success: true,
    elapsedSeconds,
    files,
  };
}

export async function generateSingleAudio(
  sectionName: string,
  text: string,
  voice: string,
  rate: string,
): Promise<GenerateSingleResponse> {
  const cleanName = sectionName.replace(/[\\/*?:"<>|]/g, '').trim() || 'slide';
  const result = await synthesizeSlideBlob(text, voice, rate);
  const audioUrl = window.URL.createObjectURL(result.blob);

  return {
    success: true,
    file: {
      sectionName: cleanName,
      filename: `${cleanName}.mp3`,
      audioBlob: result.blob,
      audioUrl,
      voiceUsed: result.voiceUsed || voice,
      sizeKb: result.sizeKb,
      durationSec: result.durationSec,
      recommendedTimelineSec: result.recommendedTimelineSec,
    },
  };
}

// ---- Mock generation for standalone demo ----

const MOCK_DURATION_PER_WORD = 0.42; // seconds per word

function mockFileForSection(
  sectionName: string,
  wordCount: number,
): GeneratedFile {
  const durationSec = Math.round(wordCount * MOCK_DURATION_PER_WORD * 10) / 10;
  const recommendedTimelineSec = Math.round((durationSec + 1) * 10) / 10;
  return {
    sectionName,
    filename: `${sectionName}.mp3`,
    audioUrl: '',
    sizeKb: Math.round(durationSec * 16 * 10) / 10,
    durationSec,
    recommendedTimelineSec,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateAudioMock(
  parseResult: ParseResult,
  _voice: string,
): Promise<GenerateResponse> {
  await delay(1200);
  const files = parseResult.sections.map((s) =>
    mockFileForSection(s.name, s.wordCount),
  );
  return {
    success: true,
    elapsedSeconds: 1.2,
    files,
  };
}

export async function generateSingleAudioMock(
  sectionName: string,
  text: string,
): Promise<GenerateSingleResponse> {
  await delay(800);
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return {
    success: true,
    file: mockFileForSection(sectionName, wordCount),
  };
}
