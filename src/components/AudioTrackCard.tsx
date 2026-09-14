import { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Download,
  RefreshCw,
  Clock,
  Copy,
  Check,
  Loader2,
  FileAudio,
  Timer,
  ChevronDown,
  ChevronUp,
  Quote,
} from 'lucide-react';
import type { GeneratedFile } from '@/types';
import { formatTime, formatSize, copyToClipboard, downloadFile } from '@/lib/audioUtils';
import { Waveform } from './Waveform';

interface AudioTrackCardProps {
  file: GeneratedFile;
  index: number;
  scriptText?: string;
  isPlaying: boolean;
  playbackRate?: number;
  onTogglePlay: () => void;
  onRegenerate: () => void;
  isRegenerating: boolean;
  onEnded?: () => void;
}

function getVoiceBadge(voiceId?: string): string {
  if (!voiceId) return '';
  return voiceId
    .replace(/^Microsoft\s+/i, '')
    .replace(/\s+Online\s+\(Natural\)/i, '')
    .replace(/^en-[A-Z]{2}-/i, '')
    .replace(/^ta-IN-/i, 'Tamil ')
    .replace(/^hi-IN-/i, 'Hindi ')
    .replace(/^fr-[A-Z]{2}-/i, 'French ')
    .replace(/^de-[A-Z]{2}-/i, 'German ')
    .replace(/^es-[A-Z]{2}-/i, 'Spanish ')
    .replace(/Neural$/i, '')
    .trim();
}

export function AudioTrackCard({
  file,
  index,
  scriptText,
  isPlaying,
  playbackRate = 1.0,
  onTogglePlay,
  onRegenerate,
  isRegenerating,
  onEnded,
}: AudioTrackCardProps) {
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [copied, setCopied] = useState(false);
  const [expandedScript, setExpandedScript] = useState(false);
  const [hasAudioError, setHasAudioError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync playbackRate with audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Reset audio error on new URL
  useEffect(() => {
    setHasAudioError(false);
  }, [file.audioUrl, file.filename]);

  // Sync real audio playback with isPlaying prop
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      if (audio.ended || (audio.duration && audio.currentTime >= audio.duration - 0.1)) {
        audio.currentTime = 0;
      }
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.debug('Playback notice:', err.message);
        });
      }
    } else {
      if (!audio.paused) {
        audio.pause();
      }
    }
  }, [isPlaying]);

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const current = audio.currentTime || 0;
    const duration = (audio.duration && !isNaN(audio.duration) && audio.duration > 0)
      ? audio.duration
      : file.durationSec || 1;
    setElapsed(current);
    setProgress(Math.min(100, Math.max(0, (current / duration) * 100)));
  };

  const handleAudioEnded = () => {
    setProgress(100);
    if (onEnded) {
      onEnded();
    }
  };

  const handleAudioError = () => {
    console.warn(`Audio loading error for ${file.filename}`);
    setHasAudioError(true);
  };

  const handleCopyTimeline = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await copyToClipboard(file.recommendedTimelineSec.toString());
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWaveformSeek = (percent: number) => {
    const audio = audioRef.current;
    const totalDuration = (audio && !isNaN(audio.duration) && audio.duration > 0)
      ? audio.duration
      : file.durationSec || 1;
    const newElapsed = (percent / 100) * totalDuration;

    if (audio) {
      audio.currentTime = newElapsed;
      if (!isPlaying) {
        onTogglePlay();
      }
    }
    setElapsed(newElapsed);
    setProgress(percent);
  };

  const indexLabel = (index + 1).toString().padStart(2, '0');
  const audioSrc = file.audioUrl || `/api/audio/${file.filename}`;
  const isLongScript = (scriptText?.length || 0) > 130;
  const voiceLabel = getVoiceBadge(file.voiceUsed);

  return (
    <div
      className={`group rounded-2xl border transition-all duration-300 animate-slide-in card-glow ${
        isPlaying
          ? 'bg-surface-2 border-[#ed7002]/60 shadow-xl shadow-[#ed7002]/10 ring-1 ring-[#ed7002]/30'
          : 'bg-surface-2 border-border-warm hover:border-[#ed7002]/40 hover:bg-surface-2/95'
      }`}
    >
      {/* Hidden Native Audio Element */}
      <audio
        ref={audioRef}
        src={audioSrc}
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleAudioEnded}
        onError={handleAudioError}
      />

      {/* Card Header */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-surface-3 border border-border-warm shrink-0">
            <span className="text-[10px] font-mono font-bold text-[#ff9138]">{indexLabel}</span>
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <FileAudio className="w-3.5 h-3.5 text-[#ff9138] shrink-0" />
            <span className="text-xs font-semibold text-text-primary truncate font-mono">
              {file.filename}
            </span>
          </div>
          {voiceLabel && (
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-[#ed7002]/15 text-[#ff9138] border border-[#ed7002]/30 shrink-0">
              🎙️ {voiceLabel}
            </span>
          )}
        </div>
        <span className="text-[11px] font-mono text-text-muted shrink-0 ml-2">{formatSize(file.sizeKb)}</span>
      </div>

      {/* Inline Script Preview Snippet */}
      {scriptText && (
        <div className="mx-4 mb-2.5 p-2.5 rounded-xl bg-surface-1/80 border border-border-warm/70 text-xs text-text-secondary leading-relaxed font-sans">
          <div className="flex items-start gap-1.5">
            <Quote className="w-3 h-3 text-[#ed7002]/70 shrink-0 mt-0.5" />
            <p className={`flex-1 ${!expandedScript && isLongScript ? 'line-clamp-2' : ''}`}>
              {scriptText}
            </p>
          </div>
          {isLongScript && (
            <button
              onClick={() => setExpandedScript(!expandedScript)}
              className="mt-1 flex items-center gap-1 text-[10px] font-medium text-[#ff9138] hover:underline ml-4"
            >
              {expandedScript ? (
                <>
                  <ChevronUp className="w-3 h-3" /> Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" /> Show full text
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Timeline Specifications */}
      <div className="flex items-center gap-2 px-4 pb-2.5">
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-surface-3 border border-border-warm">
          <Clock className="w-3 h-3 text-accent-amber" />
          <span className="text-[11px] font-mono text-text-secondary">
            <span className="text-text-primary font-semibold">{file.durationSec}s</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#ed7002]/10 border border-[#ed7002]/25">
          <Timer className="w-3 h-3 text-[#ff9138]" />
          <span className="text-[11px] font-mono text-text-secondary">
            Storyline: <span className="text-[#ff9138] font-semibold">{file.recommendedTimelineSec}s</span>
          </span>
        </div>
        <button
          onClick={handleCopyTimeline}
          className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-medium transition-all ml-auto hover:bg-surface-3"
          style={{
            color: copied ? 'var(--accent-green)' : 'var(--text-muted)',
            background: copied ? 'rgba(16,185,129,0.1)' : 'transparent',
          }}
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-accent-green" />
              <span className="text-accent-green font-semibold">Copied {file.recommendedTimelineSec}s</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy
            </>
          )}
        </button>
      </div>

      {/* Interactive Waveform Audio Visualizer */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onTogglePlay}
            className={`flex items-center justify-center w-8 h-8 rounded-full transition-all shrink-0 select-none ${
              isPlaying
                ? 'bg-[#18120d] text-[#ff9138] border border-[#ed7002]/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4),0_0_10px_rgba(237,112,2,0.3)]'
                : 'bg-surface-3 hover:bg-[#ed7002] text-text-primary hover:text-white border border-border-warm hover:border-[#ff8826]/40 shadow-[0_1px_2px_rgba(0,0,0,0.3)]'
            }`}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
          </button>

          {/* Dynamic Waveform component */}
          <div className="flex-1">
            <Waveform
              progress={progress}
              isPlaying={isPlaying}
              seed={file.sectionName + file.filename}
              onSeek={handleWaveformSeek}
              barCount={38}
              height={28}
            />
          </div>

          {/* Time & Speed indicator */}
          <div className="flex flex-col items-end shrink-0 text-right">
            <span className="text-[11px] font-mono text-text-muted tabular-nums">
              {formatTime(elapsed)} / {formatTime(file.durationSec)}
            </span>
            {playbackRate !== 1.0 && (
              <span className="text-[9px] font-mono text-[#ff9138] font-bold">
                {playbackRate}x
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card Actions Footer */}
      <div className="flex items-center gap-2 px-4 py-2 border-t border-border-warm/70 bg-surface-1/40 rounded-b-2xl">
        <button
          onClick={onRegenerate}
          disabled={isRegenerating}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-text-secondary hover:text-[#ff9138] hover:bg-[#ed7002]/10 transition-all disabled:opacity-50"
        >
          {isRegenerating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#ff9138]" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          {isRegenerating ? 'Regenerating...' : 'Regenerate'}
        </button>
        <button
          onClick={() => downloadFile(file)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-text-secondary hover:text-accent-green hover:bg-accent-green/10 transition-all ml-auto"
        >
          <Download className="w-3.5 h-3.5" />
          Download
        </button>
      </div>
    </div>
  );
}
