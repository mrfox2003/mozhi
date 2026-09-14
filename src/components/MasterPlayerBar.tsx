import { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Package,
  Volume2,
  Timer,
} from 'lucide-react';
import type { GeneratedFile } from '@/types';
import { formatTime } from '@/lib/audioUtils';

interface MasterPlayerBarProps {
  files: GeneratedFile[];
  activeIndex: number | null;
  isPlaying: boolean;
  autoplayNext: boolean;
  playbackRate: number;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onToggleAutoplay: () => void;
  onChangePlaybackRate: (rate: number) => void;
  onExportZip: () => void;
  onPlayAllFromStart: () => void;
}

const SPEED_RATES = [0.8, 1.0, 1.25, 1.5, 2.0];

export function MasterPlayerBar({
  files,
  activeIndex,
  isPlaying,
  autoplayNext,
  playbackRate,
  onTogglePlay,
  onNext,
  onPrev,
  onToggleAutoplay,
  onChangePlaybackRate,
  onExportZip,
  onPlayAllFromStart,
}: MasterPlayerBarProps) {
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);

  // Close speed menu when clicked outside
  useEffect(() => {
    const close = () => setSpeedMenuOpen(false);
    if (speedMenuOpen) {
      document.addEventListener('click', close);
      return () => document.removeEventListener('click', close);
    }
  }, [speedMenuOpen]);

  if (files.length === 0) return null;

  const currentFile = activeIndex !== null ? files[activeIndex] : files[0];
  const currentIndex = activeIndex !== null ? activeIndex : 0;
  const isLastTrack = currentIndex >= files.length - 1;
  const isFirstTrack = currentIndex <= 0;

  const totalCourseDuration = files.reduce((acc, f) => acc + (f.durationSec || 0), 0);

  return (
    <div className="sticky bottom-0 z-40 border-t border-border-warm bg-[#13100e]/95 backdrop-blur-2xl px-5 py-3 shadow-2xl shadow-black/90">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        {/* Left: Active Track Details */}
        <div className="flex items-center gap-3 min-w-[220px] max-w-[320px]">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-[#ed7002]/25 to-[#ff9138]/20 border border-[#ed7002]/35 shrink-0">
            <Volume2 className="w-4 h-4 text-[#ff9138]" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-surface-3 text-[#ff9138] border border-border-warm">
                {String(currentIndex + 1).padStart(2, '0')}/{String(files.length).padStart(2, '0')}
              </span>
              <span className="text-xs font-semibold text-text-primary truncate font-mono">
                {currentFile?.filename || 'Course Overview'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-text-muted">
              <span>{currentFile?.durationSec}s</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-[#ff9138]">
                <Timer className="w-3 h-3" />
                Storyline: {currentFile?.recommendedTimelineSec}s
              </span>
            </div>
          </div>
        </div>

        {/* Center: Playback Controls & Master Autoplay */}
        <div className="flex items-center gap-3">
          {/* Prev button */}
          <button
            onClick={onPrev}
            disabled={isFirstTrack}
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-3 transition-colors disabled:opacity-30 disabled:pointer-events-none"
            title="Previous Track"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Master Play / Pause Button */}
          <button
            onClick={onTogglePlay}
            className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-150 transform select-none ${
              isPlaying
                ? 'bg-[#18120d] text-[#ff9138] border border-[#ed7002]/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4),0_0_12px_rgba(237,112,2,0.3)]'
                : 'bg-gradient-to-b from-[#f37604] to-[#e06500] text-white border border-[#ff8826]/40 border-b-[#b85000] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_1px_3px_rgba(0,0,0,0.5),0_0_14px_rgba(237,112,2,0.25)] hover:from-[#ff7f08] hover:to-[#eb6c00] hover:border-[#ffa048]/60 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.32),0_2px_10px_rgba(237,112,2,0.38)] active:translate-y-[0.5px]'
            }`}
            title={isPlaying ? 'Pause Track' : 'Play Track'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </button>

          {/* Next button */}
          <button
            onClick={onNext}
            disabled={isLastTrack}
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-3 transition-colors disabled:opacity-30 disabled:pointer-events-none"
            title="Next Track"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Autoplay / Continuous Course Mode Toggle */}
          <button
            onClick={onToggleAutoplay}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              autoplayNext
                ? 'bg-[#ed7002]/20 text-[#ff9138] border-[#ed7002]/40 shadow-[0_0_14px_rgba(237,112,2,0.25)]'
                : 'bg-surface-2 text-text-muted border-border-warm hover:text-text-secondary'
            }`}
            title="When active, automatically plays next slide when current slide ends"
          >
            <Repeat className={`w-3.5 h-3.5 ${autoplayNext ? 'text-[#ff9138]' : ''}`} />
            <span className="hidden sm:inline">Continuous</span>
            <span className={`text-[10px] font-mono px-1 rounded ${autoplayNext ? 'bg-[#ed7002]/30 text-[#ff9138] font-bold' : 'bg-surface-3 text-text-muted'}`}>
              {autoplayNext ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>

        {/* Right: Multipliers & Course Actions */}
        <div className="flex items-center gap-2">
          {/* Speed Multiplier */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSpeedMenuOpen(!speedMenuOpen);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-mono font-medium text-text-secondary bg-surface-2 hover:bg-surface-3 border border-border-warm transition-colors"
              title="Change audio playback speed"
            >
              <span>{playbackRate}x</span>
            </button>

            {speedMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute bottom-full right-0 mb-2 w-32 rounded-2xl bg-[#1a1410]/95 border border-border-warm p-1.5 shadow-2xl z-50 animate-fade-in shadow-black/80"
              >
                <div className="text-[10px] uppercase font-semibold text-text-muted px-2 py-1">
                  Speed
                </div>
                {SPEED_RATES.map((rate) => (
                  <button
                    key={rate}
                    onClick={() => {
                      onChangePlaybackRate(rate);
                      setSpeedMenuOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                      playbackRate === rate
                        ? 'bg-[#ed7002]/20 text-[#ff9138] font-bold'
                        : 'text-text-secondary hover:bg-surface-3 hover:text-text-primary'
                    }`}
                  >
                    {rate}x {rate === 1.0 && '(Normal)'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Play Course From Start */}
          <button
            onClick={onPlayAllFromStart}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#ff9138] bg-[#ed7002]/15 hover:bg-[#ed7002]/25 border border-[#ed7002]/30 transition-all"
            title="Play entire course from Slide 1"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Play Course ({formatTime(totalCourseDuration)})</span>
          </button>

          {/* Export All ZIP */}
          <button
            onClick={onExportZip}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-text-primary bg-surface-2 hover:bg-surface-3 border border-border-warm transition-all"
            title="Download all slide audio files as ZIP"
          >
            <Package className="w-3.5 h-3.5 text-accent-green" />
            <span className="hidden sm:inline">Export ZIP</span>
          </button>
        </div>
      </div>
    </div>
  );
}
