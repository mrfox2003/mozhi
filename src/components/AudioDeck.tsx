import { useState } from 'react';
import {
  Search,
  Headphones,
  CheckCircle2,
  Loader2,
  Mic,
} from 'lucide-react';
import type { GeneratedFile, GenerationStatus, ScriptSection } from '@/types';
import { AudioTrackCard } from './AudioTrackCard';

interface AudioDeckProps {
  files: GeneratedFile[];
  sections?: ScriptSection[];
  generationStatus: GenerationStatus;
  playingIndex: number | null;
  playbackRate?: number;
  onTogglePlay: (index: number) => void;
  onRegenerate: (index: number) => void;
  regeneratingIndex: number | null;
  onTrackEnded?: (index: number) => void;
}

export function AudioDeck({
  files,
  sections = [],
  generationStatus,
  playingIndex,
  playbackRate = 1.0,
  onTogglePlay,
  onRegenerate,
  regeneratingIndex,
  onTrackEnded,
}: AudioDeckProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFiles = files.filter((f) =>
    f.sectionName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const tracksReady = files.length;
  const isGenerating = generationStatus === 'generating';

  return (
    <div className="flex flex-col h-full bg-surface-1/95">
      {/* Deck Toolbar */}
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-border-warm bg-surface-1 shrink-0">
        <div className="flex items-center gap-2">
          <Headphones className="w-4 h-4 text-[#ff9138]" />
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Slide Audio Deck
          </span>
          {tracksReady > 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#ed7002]/15 text-[#ff9138] border border-[#ed7002]/30">
              {tracksReady} {tracksReady === 1 ? 'Track' : 'Tracks'}
            </span>
          )}
        </div>
      </div>

      {/* Search filter */}
      {tracksReady > 0 && (
        <div className="px-4 py-2.5 border-b border-border-warm bg-surface-1/50 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
            <input
              type="text"
              placeholder="Filter slides by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-surface-2 text-xs text-text-primary placeholder:text-text-muted border border-border-warm focus:border-border-focus transition-colors"
            />
          </div>
        </div>
      )}

      {/* Track list / states */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
        {isGenerating && files.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="relative mb-4">
              <div className="absolute inset-0 rounded-full bg-[#ed7002]/25 animate-pulse-ring" />
              <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-[#ed7002]/15 border border-[#ed7002]/35 shadow-lg shadow-[#ed7002]/20">
                <Loader2 className="w-7 h-7 text-[#ff9138] animate-spin" />
              </div>
            </div>
            <p className="text-sm font-semibold text-text-primary mb-1">Synthesizing voiceovers...</p>
            <p className="text-xs text-text-muted">Generating audio for each slide section</p>
          </div>
        )}

        {tracksReady === 0 && !isGenerating && (
          <div className="flex flex-col items-center justify-center h-full text-center px-8 animate-fade-in">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-surface-2 border border-border-warm mb-4 shadow-xl">
              <Mic className="w-7 h-7 text-[#ff9138]/60" />
            </div>
            <p className="text-sm font-semibold text-text-secondary mb-2">No audio tracks yet</p>
            <p className="text-xs text-text-muted max-w-[240px] leading-relaxed">
              Write your script on the left and click <span className="text-[#ff9138] font-semibold">Generate All</span> or press{' '}
              <kbd className="px-1.5 py-0.5 rounded-md text-[10px] font-mono bg-surface-3 border border-border-warm text-[#ff9138]">⌘ Enter</kbd>
            </p>
          </div>
        )}

        {filteredFiles.map((file) => {
          const originalIndex = files.indexOf(file);
          const matchedSection =
            sections.find((s) => s.name === file.sectionName) || sections[originalIndex];

          return (
            <AudioTrackCard
              key={`${file.sectionName}-${file.audioUrl || file.filename}`}
              file={file}
              index={originalIndex}
              scriptText={matchedSection?.text}
              isPlaying={playingIndex === originalIndex}
              playbackRate={playbackRate}
              onTogglePlay={() => onTogglePlay(originalIndex)}
              onRegenerate={() => onRegenerate(originalIndex)}
              isRegenerating={regeneratingIndex === originalIndex}
              onEnded={() => onTrackEnded && onTrackEnded(originalIndex)}
            />
          );
        })}

        {filteredFiles.length === 0 && tracksReady > 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-xs text-text-muted">No slides match "{searchQuery}"</p>
          </div>
        )}
      </div>

      {/* Status bar */}
      {tracksReady > 0 && !isGenerating && (
        <div className="flex items-center gap-2 px-4 py-2.5 border-t border-border-warm bg-surface-1/70 shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5 text-accent-green" />
          <span className="text-xs font-medium text-text-secondary">
            {tracksReady} audio {tracksReady === 1 ? 'track' : 'tracks'} ready and synchronized
          </span>
        </div>
      )}
    </div>
  );
}
