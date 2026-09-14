import { useEffect } from 'react';
import { RefreshCw, CheckCircle2, ArrowRight, X, Volume2 } from 'lucide-react';
import type { Voice } from '@/types';
import { CURATED_PRESETS } from '@/data/voices';

interface VoiceSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  oldVoiceId: string;
  newVoiceId: string;
  voices: Voice[];
  trackCount: number;
  onConfirmRegenerate: () => void;
  onConfirmSwitchOnly: () => void;
}

function getVoiceMetadata(voiceId: string, voices: Voice[]) {
  const preset = CURATED_PRESETS.find((p) => p.voiceId === voiceId);
  const voiceObj = voices.find((v) => v.id === voiceId);
  const name = (preset?.name || voiceObj?.name || voiceId)
    .replace(/^Microsoft\s+/i, '')
    .replace(/\s+Online\s+\(Natural\)/i, '')
    .replace(/\s+-\s+.*$/, '')
    .trim();
  const accent = preset?.accent || (voiceObj ? `${voiceObj.locale} ${voiceObj.gender}` : 'Neural Voice');
  const flag = preset?.flag || '🎙️';
  return { name, accent, flag };
}

export function VoiceSwitchModal({
  isOpen,
  onClose,
  oldVoiceId,
  newVoiceId,
  voices,
  trackCount,
  onConfirmRegenerate,
  onConfirmSwitchOnly,
}: VoiceSwitchModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const oldMeta = getVoiceMetadata(oldVoiceId, voices);
  const newMeta = getVoiceMetadata(newVoiceId, voices);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-[#14100d] border border-[#3c3125] shadow-2xl p-5 overflow-hidden shadow-black card-glow">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3.5 border-b border-[#3c3125]">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#ed7002]/15 text-[#ff9138] border border-[#ed7002]/30 shrink-0 shadow-sm">
              <RefreshCw className="w-4 h-4 text-[#ff9138]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                <span>Switch Audio Model Voice?</span>
              </h3>
              <p className="text-[11px] text-text-muted">
                {trackCount} slide {trackCount === 1 ? 'audio track is' : 'audio tracks are'} currently generated
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-[#251d17] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Model Voice Comparison Card */}
        <div className="py-4">
          <div className="p-3.5 rounded-xl bg-[#1c1611] border border-[#30261d] flex items-center justify-between gap-2">
            {/* Previous Voice */}
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-mono font-semibold text-text-muted uppercase">Current</span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{oldMeta.flag}</span>
                <span className="text-xs font-bold text-text-primary">{oldMeta.name}</span>
              </div>
              <span className="text-[10px] text-text-muted">{oldMeta.accent}</span>
            </div>

            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[#251d17] border border-[#3c3125] text-[#ff9138] shrink-0">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>

            {/* New Voice */}
            <div className="flex flex-col gap-0.5 items-end text-right">
              <span className="text-[10px] font-mono font-semibold text-[#ff9138] uppercase">Selected</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#ff9138]">{newMeta.name}</span>
                <span className="text-sm">{newMeta.flag}</span>
              </div>
              <span className="text-[10px] text-text-secondary">{newMeta.accent}</span>
            </div>
          </div>

          <p className="text-xs text-text-secondary mt-3 leading-relaxed">
            Would you like to re-synthesize all <strong className="text-text-primary">{trackCount} slide tracks</strong> with <strong className="text-[#ff9138]">{newMeta.name}'s voice</strong> now?
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-2 border-t border-[#3c3125]">
          {/* Option 1: Regenerate All (Primary Action) */}
          <button
            onClick={onConfirmRegenerate}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-gradient-to-b from-[#f37604] to-[#e06500] border border-[#ff8826]/40 border-b-[#b85000] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_1px_3px_rgba(0,0,0,0.5),0_0_14px_rgba(237,112,2,0.22)] hover:from-[#ff7f08] hover:to-[#eb6c00] hover:border-[#ffa048]/60 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.32),0_2px_10px_rgba(237,112,2,0.38)] active:translate-y-[0.5px] active:from-[#d65f00] active:to-[#c85600] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] transition-all"
          >
            <span>Regenerate All {trackCount} Slides in {newMeta.name}'s Voice</span>
          </button>

          <div className="flex items-center gap-2">
            {/* Option 2: Switch Voice Model Only */}
            <button
              onClick={onConfirmSwitchOnly}
              className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary bg-[#1c1611] hover:bg-[#251d17] border border-[#30261d] transition-colors"
            >
              Switch Voice Only
            </button>

            {/* Option 3: Cancel */}
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-text-muted hover:text-text-primary hover:bg-[#251d17] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
