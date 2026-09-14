import { useState, useRef, useEffect } from 'react';
import {
  Mic,
  ChevronDown,
  Search,
  Volume2,
  Loader2,
  Check,
  HelpCircle,
  Play,
  Square,
  Globe,
} from 'lucide-react';
import type { Voice, GenerationStatus } from '@/types';
import {
  REGIONS,
  CURATED_PRESETS,
  SPEED_OPTIONS,
  getRegionForVoice,
  getDefaultVoiceForRegion,
} from '@/data/voices';

interface StudioHeaderProps {
  voices: Voice[];
  selectedVoice: string;
  onVoiceChange: (voiceId: string) => void;
  selectedSpeed: string;
  onSpeedChange: (speed: string) => void;
  onGenerate: () => void;
  generationStatus: GenerationStatus;
  generationProgress: { current: number; total: number };
  onOpenShortcuts?: () => void;
}

function formatVoiceDisplay(name: string): string {
  if (!name) return 'Select Voice';
  return name
    .replace(/^Microsoft\s+/i, '')
    .replace(/\s+Online\s+\(Natural\)/i, '')
    .replace(/\s+-\s+.*$/, '')
    .trim();
}

export function StudioHeader({
  voices,
  selectedVoice,
  onVoiceChange,
  selectedSpeed,
  onSpeedChange,
  onGenerate,
  generationStatus,
  generationProgress,
  onOpenShortcuts,
}: StudioHeaderProps) {
  const [regionDropdownOpen, setRegionDropdownOpen] = useState(false);
  const [voiceDropdownOpen, setVoiceDropdownOpen] = useState(false);
  const [speedDropdownOpen, setSpeedDropdownOpen] = useState(false);
  const [selectedRegionKey, setSelectedRegionKey] = useState<string>('us');
  const [searchQuery, setSearchQuery] = useState('');
  const [auditioningVoiceId, setAuditioningVoiceId] = useState<string | null>(null);

  const regionRef = useRef<HTMLDivElement>(null);
  const voiceRef = useRef<HTMLDivElement>(null);
  const speedRef = useRef<HTMLDivElement>(null);
  const auditionAudioRef = useRef<HTMLAudioElement | null>(null);

  // Sync region when selectedVoice updates externally
  useEffect(() => {
    if (selectedVoice && voices.length > 0) {
      const reg = getRegionForVoice(selectedVoice, voices);
      setSelectedRegionKey(reg);
    }
  }, [selectedVoice, voices]);

  // Click outside handlers
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (regionRef.current && !regionRef.current.contains(e.target as Node)) {
        setRegionDropdownOpen(false);
      }
      if (voiceRef.current && !voiceRef.current.contains(e.target as Node)) {
        setVoiceDropdownOpen(false);
      }
      if (speedRef.current && !speedRef.current.contains(e.target as Node)) {
        setSpeedDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Cleanup audition audio on unmount or popover close
  useEffect(() => {
    if (!voiceDropdownOpen && auditionAudioRef.current) {
      auditionAudioRef.current.pause();
      auditionAudioRef.current = null;
      setAuditioningVoiceId(null);
    }
  }, [voiceDropdownOpen]);

  const currentVoiceObj = voices.find((v) => v.id === selectedVoice) ?? voices[0];
  const matchedPreset = CURATED_PRESETS.find((p) => p.voiceId === selectedVoice);
  const displayVoiceName = formatVoiceDisplay(currentVoiceObj?.name ?? 'Jenny');
  const displayAccent = matchedPreset?.accent ?? (currentVoiceObj ? `${currentVoiceObj.locale} ${currentVoiceObj.gender}` : 'US Female');
  const displayFlag = matchedPreset?.flag ?? '🎙️';

  const currentRegion = REGIONS.find((r) => r.key === selectedRegionKey) ?? REGIONS[0];
  const currentSpeedLabel = SPEED_OPTIONS.find((s) => s.value === selectedSpeed)?.label ?? 'Normal';

  // Filter voices by selected region + search query
  const availableVoices = voices.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.locale.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (currentRegion.key === 'all') return true;

    // Check if voice locale matches any of the region's locale prefixes
    return currentRegion.localePrefixes.some((prefix) => v.locale.toLowerCase().startsWith(prefix.toLowerCase()));
  });

  const handleSelectRegion = (regionKey: string) => {
    setSelectedRegionKey(regionKey);
    setRegionDropdownOpen(false);

    // Check if current voice belongs to the newly selected region
    const regionObj = REGIONS.find((r) => r.key === regionKey);
    const voiceMatches =
      regionKey === 'all' ||
      (currentVoiceObj &&
        regionObj?.localePrefixes.some((prefix) =>
          currentVoiceObj.locale.toLowerCase().startsWith(prefix.toLowerCase())
        ));

    if (!voiceMatches) {
      const defaultVoiceId = getDefaultVoiceForRegion(regionKey, voices);
      onVoiceChange(defaultVoiceId);
    }
  };

  const handleStopAudition = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (auditionAudioRef.current) {
      auditionAudioRef.current.pause();
      auditionAudioRef.current.currentTime = 0;
      auditionAudioRef.current = null;
    }
    window.speechSynthesis?.cancel();
    setAuditioningVoiceId(null);
  };

  const handleAudition = (voiceId: string, voiceName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // Toggle stop if already playing this voice
    if (auditioningVoiceId === voiceId) {
      handleStopAudition();
      return;
    }

    handleStopAudition();
    setAuditioningVoiceId(voiceId);

    // Play real Neural Edge-TTS speech sample via backend API
    const audioUrl = `/api/audition?voice=${encodeURIComponent(voiceId)}&speed=${encodeURIComponent(selectedSpeed)}`;
    const audio = new Audio(audioUrl);
    auditionAudioRef.current = audio;

    audio.onended = () => {
      setAuditioningVoiceId(null);
      auditionAudioRef.current = null;
    };

    audio.onerror = () => {
      // Fallback to Web Speech API if backend endpoint is unavailable
      try {
        const cleanName = formatVoiceDisplay(voiceName);
        const utterance = new SpeechSynthesisUtterance(
          `Hello, this is ${cleanName}. Welcome to Mozhi Studio.`,
        );
        utterance.rate = parseFloat(selectedSpeed.replace('%', '')) / 100 + 1;
        
        const sysVoices = window.speechSynthesis.getVoices();
        const match = sysVoices.find(
          (v) =>
            v.name.toLowerCase().includes(voiceName.toLowerCase()) ||
            v.lang.toLowerCase().includes(voiceId.substring(0, 5).toLowerCase())
        );
        if (match) utterance.voice = match;

        utterance.onend = () => setAuditioningVoiceId(null);
        utterance.onerror = () => setAuditioningVoiceId(null);
        window.speechSynthesis.speak(utterance);
      } catch {
        setAuditioningVoiceId(null);
      }
    };

    audio.play().catch(() => {
      // Catch autoplay policy restrictions
      setAuditioningVoiceId(null);
    });
  };

  const isGenerating = generationStatus === 'generating';

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-border-warm glass-header px-4 lg:px-6 h-14 shrink-0 select-none">
      {/* Left: Brand */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#1a1410] border border-[#3c3125] p-1 shrink-0 overflow-hidden logo-breathe transition-all duration-500">
          <img
            src="/brand-mark.png"
            alt="Mozhi"
            className="w-full h-full object-contain mark-breathe"
          />
        </div>
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-bold tracking-tight brand-gradient">Mozhi Studio</span>
          </div>
          <span className="text-[9.5px] text-text-muted font-medium tracking-wide leading-none">
            E-Learning Content Studio
          </span>
        </div>
      </div>

      {/* Center: Linked Region & Voice Dropdown Controls */}
      <div className="flex items-center gap-2 lg:gap-3">
        {/* 1. Dedicated Region Dropdown */}
        <div ref={regionRef} className="relative">
          <button
            onClick={() => {
              setRegionDropdownOpen(!regionDropdownOpen);
              setVoiceDropdownOpen(false);
              setSpeedDropdownOpen(false);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-text-primary bg-surface-2 hover:bg-surface-3 border border-border-warm hover:border-[#ed7002]/50 transition-all card-glow group"
            title="Select Voice Region"
          >
            <span className="text-base leading-none">{currentRegion.flag}</span>
            <span className="hidden md:inline text-text-secondary group-hover:text-text-primary transition-colors">
              {currentRegion.label}
            </span>
            <span className="md:hidden text-text-secondary group-hover:text-text-primary font-bold">
              {currentRegion.shortLabel}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-text-muted group-hover:text-text-primary transition-colors ml-0.5" />
          </button>

          {/* Region Dropdown Menu */}
          {regionDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-64 rounded-2xl bg-[#14100d] border border-[#3c3125] shadow-2xl p-1.5 z-[100] animate-fade-in shadow-black">
              <div className="px-2.5 py-1.5 text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider border-b border-[#3c3125] mb-1">
                Select Region / Accent
              </div>
              <div className="max-h-72 overflow-y-auto space-y-0.5">
                {REGIONS.map((reg) => {
                  const isSelected = reg.key === selectedRegionKey;
                  return (
                    <button
                      key={reg.key}
                      onClick={() => handleSelectRegion(reg.key)}
                      className={`flex items-center justify-between w-full px-2.5 py-2 rounded-xl text-xs font-medium transition-colors ${
                        isSelected
                          ? 'bg-[#281507] text-[#ff9138] font-bold border border-[#ed7002]'
                          : 'text-text-secondary hover:bg-[#251d17] hover:text-text-primary'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="text-base">{reg.flag}</span>
                        <span className="truncate">{reg.label}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#ff9138] shrink-0 ml-1.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 2. Available Voices Dropdown (Filtered by Region) */}
        <div ref={voiceRef} className="relative">
          <button
            onClick={() => {
              setVoiceDropdownOpen(!voiceDropdownOpen);
              setRegionDropdownOpen(false);
              setSpeedDropdownOpen(false);
            }}
            className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl text-xs font-medium text-text-primary bg-surface-2 hover:bg-surface-3 border border-border-warm hover:border-[#ed7002]/50 transition-all card-glow group"
            title="Choose Voice for selected region"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-sm leading-none">{displayFlag}</span>
              <span className="font-bold text-text-primary">{displayVoiceName}</span>
            </div>
            <span className="hidden sm:inline px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-[#ed7002]/15 text-[#ff9138] border border-[#ed7002]/30">
              {displayAccent}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-text-muted group-hover:text-text-primary transition-colors ml-0.5" />
          </button>

          {/* Available Voices Modal Popover */}
          {voiceDropdownOpen && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 mt-2 w-[380px] sm:w-[460px] rounded-2xl bg-[#14100d] border border-[#3c3125] shadow-2xl animate-fade-in z-[100] overflow-hidden shadow-black">
              
              {/* Header Bar: Region status & Search input */}
              <div className="p-3 border-b border-[#3c3125] bg-[#1a1410] space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{currentRegion.flag}</span>
                    <span className="text-xs font-bold text-text-primary">{currentRegion.label}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#ff9138] font-semibold">
                    {availableVoices.length} {availableVoices.length === 1 ? 'voice' : 'voices'} available
                  </span>
                </div>

                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                  <input
                    type="text"
                    placeholder={`Search voices in ${currentRegion.shortLabel}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#231b15] text-xs text-text-primary placeholder:text-text-muted border border-[#3c3125] focus:border-[#ed7002] transition-all"
                    autoFocus
                  />
                </div>
              </div>

              {/* Available Voices Grid for Selected Region */}
              <div className="p-3 max-h-[320px] overflow-y-auto bg-[#14100d]">
                {availableVoices.length === 0 ? (
                  <div className="py-8 text-center text-xs text-text-muted">
                    No voices found matching "{searchQuery}" in {currentRegion.label}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {availableVoices.map((voice) => {
                      const isSelected = voice.id === selectedVoice;
                      const isAuditioning = auditioningVoiceId === voice.id;
                      const presetMeta = CURATED_PRESETS.find((p) => p.voiceId === voice.id);
                      const cleanName = formatVoiceDisplay(voice.name);

                      return (
                        <div
                          key={voice.id}
                          onClick={() => {
                            onVoiceChange(voice.id);
                            setVoiceDropdownOpen(false);
                          }}
                          className={`group relative flex flex-col justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-[#281507] border-[#ed7002] shadow-md shadow-[#ed7002]/20 ring-1 ring-[#ed7002]/50'
                              : 'bg-[#1c1611] border-[#30261d] hover:border-[#ed7002]/50 hover:bg-[#251d17]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1.5 mb-1.5">
                            <div>
                              <div className="text-xs font-bold text-text-primary group-hover:text-[#ff9138] transition-colors flex items-center gap-1.5">
                                <span>{cleanName}</span>
                              </div>
                              <div className="text-[10px] font-medium text-text-muted">
                                {voice.gender} · {voice.locale}
                              </div>
                            </div>

                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-[#ed7002] text-white flex items-center justify-center shrink-0 shadow-sm">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-1.5 border-t border-[#30261d] mt-1">
                            <span className="text-[10px] font-mono text-[#ff9138] font-medium truncate max-w-[120px]">
                              {presetMeta ? presetMeta.style : 'Neural Voice'}
                            </span>

                            <button
                              onClick={(e) => handleAudition(voice.id, voice.name, e)}
                              className="p-1 rounded-md text-text-muted hover:text-[#ff9138] hover:bg-[#30261d] transition-colors"
                              title="Audition Voice Sample"
                            >
                              {isAuditioning ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#ff9138]" />
                              ) : (
                                <Play className="w-3.5 h-3.5 fill-current" />
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Sleek Minimal Audition Player Bar */}
              <div className="px-3.5 py-2.5 border-t border-[#3c3125] bg-[#1a1410] flex items-center justify-between text-xs min-h-[44px]">
                {auditioningVoiceId ? (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={handleStopAudition}
                        className="w-6 h-6 rounded-lg bg-[#ed7002] text-white flex items-center justify-center hover:bg-[#f97316] transition-all shadow-sm"
                        title="Stop Audition"
                      >
                        <Square className="w-2.5 h-2.5 fill-current" />
                      </button>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-text-primary">
                          Auditioning {formatVoiceDisplay(voices.find((v) => v.id === auditioningVoiceId)?.name ?? '')}
                        </span>
                        {/* Live Mini Equalizer Bars */}
                        <div className="flex items-center gap-0.5 h-3">
                          <span className="w-0.5 bg-[#ed7002] rounded-full h-full animate-[eq-bounce_0.6s_ease-in-out_infinite]" />
                          <span className="w-0.5 bg-[#ed7002] rounded-full h-2 animate-[eq-bounce_0.8s_ease-in-out_infinite_0.1s]" />
                          <span className="w-0.5 bg-[#ed7002] rounded-full h-full animate-[eq-bounce_0.5s_ease-in-out_infinite_0.2s]" />
                          <span className="w-0.5 bg-[#ed7002] rounded-full h-1.5 animate-[eq-bounce_0.7s_ease-in-out_infinite_0.3s]" />
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleStopAudition}
                      className="text-[10px] font-mono text-text-muted hover:text-[#ff9138] transition-colors"
                    >
                      Stop
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full text-text-muted text-[11px]">
                    <div className="flex items-center gap-1.5 truncate max-w-[260px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ed7002]/80 shrink-0" />
                      <span className="truncate">Click to select · Press ▶ to preview</span>
                    </div>
                    <button
                      onClick={(e) => handleAudition(selectedVoice, displayVoiceName, e)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#231b15] hover:bg-[#2d231b] text-text-secondary hover:text-[#ff9138] border border-[#3c3125] hover:border-[#ed7002]/40 transition-all text-[11px] font-medium shrink-0"
                    >
                      <Play className="w-2.5 h-2.5 fill-current text-[#ed7002]" />
                      <span>Preview Active</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 3. Speed Multiplier Dropdown */}
        <div ref={speedRef} className="relative">
          <button
            onClick={() => {
              setSpeedDropdownOpen(!speedDropdownOpen);
              setVoiceDropdownOpen(false);
              setRegionDropdownOpen(false);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-text-primary bg-surface-2 hover:bg-surface-3 border border-border-warm hover:border-[#ed7002]/50 transition-all card-glow"
          >
            <span className="text-text-muted">Speed:</span>
            <span className="font-bold text-text-primary">{currentSpeedLabel}</span>
            <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
          </button>

          {speedDropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-36 rounded-2xl bg-[#14100d] border border-[#3c3125] shadow-2xl p-1.5 z-[100] animate-fade-in shadow-black">
              {SPEED_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onSpeedChange(opt.value);
                    setSpeedDropdownOpen(false);
                  }}
                  className={`flex items-center justify-between w-full px-3 py-1.5 rounded-xl text-xs transition-colors ${
                    opt.value === selectedSpeed
                      ? 'bg-[#281507] text-[#ff9138] font-bold border border-[#ed7002]'
                      : 'text-text-secondary hover:bg-[#251d17] hover:text-text-primary'
                  }`}
                >
                  <span>{opt.label}</span>
                  {opt.value === selectedSpeed && <Check className="w-3.5 h-3.5 text-[#ff9138]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Shortcuts & Generate All */}
      <div className="flex items-center gap-2.5 shrink-0">
        {onOpenShortcuts && (
          <button
            onClick={onOpenShortcuts}
            className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-2 border border-transparent hover:border-border-warm transition-colors"
            title="Keyboard Shortcuts (?)"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className={`relative group inline-flex items-center justify-center gap-2 h-9 px-4 rounded-xl text-xs font-semibold tracking-tight transition-all duration-150 shrink-0 select-none ${
            isGenerating
              ? 'bg-[#1a130e] border border-[#ed7002]/50 text-[#ff9138] cursor-wait shadow-inner'
              : 'bg-gradient-to-b from-[#f37604] to-[#e06500] text-white border border-[#ff8826]/40 border-b-[#b85000] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_1px_3px_rgba(0,0,0,0.5),0_0_14px_rgba(237,112,2,0.22)] hover:from-[#ff7f08] hover:to-[#eb6c00] hover:border-[#ffa048]/60 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.32),0_2px_10px_rgba(237,112,2,0.38)] active:translate-y-[0.5px] active:from-[#d65f00] active:to-[#c85600] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]'
          }`}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#ff9138] shrink-0" />
              <span className="font-mono text-[11px] font-medium text-[#ff9138]">
                Slide {generationProgress.current}/{generationProgress.total}
              </span>
            </>
          ) : (
            <span>Generate All</span>
          )}
        </button>
      </div>
    </header>
  );
}
