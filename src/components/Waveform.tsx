import React, { useMemo } from 'react';

interface WaveformProps {
  progress: number; // 0 to 100
  isPlaying: boolean;
  seed: string;
  onSeek: (percent: number) => void;
  barCount?: number;
  height?: number;
}

// Generate pseudo-random deterministic heights for realistic speech waveforms
function generateHeights(seed: string, count: number): number[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }

  const heights: number[] = [];
  for (let i = 0; i < count; i++) {
    const pseudo = Math.abs(Math.sin(hash + i * 0.45) * 0.7 + Math.cos(i * 0.8) * 0.3);
    const normalized = Math.min(95, Math.max(18, Math.round(pseudo * 100)));
    heights.push(normalized);
  }
  return heights;
}

export function Waveform({
  progress,
  isPlaying,
  seed,
  onSeek,
  barCount = 36,
  height = 32,
}: WaveformProps) {
  const bars = useMemo(() => generateHeights(seed, barCount), [seed, barCount]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
    onSeek(pct);
  };

  return (
    <div
      onClick={handleClick}
      className="relative flex items-center gap-[2.5px] w-full cursor-pointer py-1 group/wave select-none"
      style={{ height: `${height}px` }}
      title="Click or drag to scrub audio"
    >
      {bars.map((barHeight, idx) => {
        const barPct = (idx / (barCount - 1)) * 100;
        const isPassed = barPct <= progress;

        return (
          <div
            key={idx}
            className="flex-1 flex items-center justify-center h-full"
          >
            <div
              className={`w-full rounded-full transition-all duration-150 ${
                isPassed
                  ? 'bg-gradient-to-t from-[#ed7002] via-[#f97316] to-[#ff9138] shadow-[0_0_8px_rgba(237,112,2,0.45)]'
                  : 'bg-surface-3 group-hover/wave:bg-surface-elevated'
              } ${isPlaying && isPassed ? 'opacity-100' : isPassed ? 'opacity-90' : 'opacity-60'}`}
              style={{
                height: `${barHeight}%`,
                minWidth: '2px',
              }}
            />
          </div>
        );
      })}

      {/* Scrub indicator line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(237,112,2,0.9)] pointer-events-none transition-all duration-75"
        style={{ left: `${progress}%` }}
      />
    </div>
  );
}
