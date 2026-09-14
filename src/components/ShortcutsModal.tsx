import { useEffect } from 'react';
import { X, Command, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
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

  const shortcuts = [
    { key: '⌘ / Ctrl + Enter', desc: 'Generate audio for all slides' },
    { key: 'Space', desc: 'Toggle play / pause on active track' },
    { key: 'Click Waveform', desc: 'Instant audio scrubbing / seeking' },
    { key: 'Continuous Mode', desc: 'Auto-advance course playback' },
    { key: 'Esc', desc: 'Close dialogs and popovers' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-[#1a1410] border border-border-warm shadow-2xl p-5 overflow-hidden shadow-black/90 card-glow">
        {/* Glow Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border-warm">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#ed7002]/15 text-[#ff9138] border border-[#ed7002]/30">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">Keyboard Shortcuts</h3>
              <p className="text-[11px] text-text-muted">Accelerate your E-Learning voiceover workflow</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-3 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="py-3 space-y-2.5">
          {shortcuts.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-surface-1/70 border border-border-warm/60"
            >
              <span className="text-xs text-text-secondary">{s.desc}</span>
              <kbd className="px-2 py-1 rounded-lg bg-surface-3 border border-border-warm text-[11px] font-mono font-bold text-[#ff9138] shadow-sm">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-border-warm flex items-center justify-between text-[11px] text-text-muted">
          <span className="flex items-center gap-1 font-mono">
            <Command className="w-3 h-3 text-[#ff9138]" />
            <span>Mozhi Studio • E-Learning Content Studio</span>
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-surface-3 hover:bg-surface-elevated text-xs font-semibold text-text-primary border border-border-warm transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
