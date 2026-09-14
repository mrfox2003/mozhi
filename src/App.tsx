import { useState, useEffect, useCallback, useMemo } from 'react';
import { PencilLine, Headphones } from 'lucide-react';
import { StudioHeader } from '@/components/StudioHeader';
import { ScriptWorkbench } from '@/components/ScriptWorkbench';
import { AudioDeck } from '@/components/AudioDeck';
import { MasterPlayerBar } from '@/components/MasterPlayerBar';
import { Toast } from '@/components/Toast';
import { ShortcutsModal } from '@/components/ShortcutsModal';
import { VoiceSwitchModal } from '@/components/VoiceSwitchModal';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { parseScript, SAMPLE_SCRIPT } from '@/lib/scriptParser';
import { downloadAllAsZip } from '@/lib/audioUtils';
import {
  fetchVoices,
  generateAudio,
  generateAudioMock,
  generateSingleAudio,
  generateSingleAudioMock,
} from '@/lib/api';
import type { Voice, GeneratedFile, GenerationStatus } from '@/types';
import { ALL_VOICES } from '@/data/voices';

type MobileTab = 'script' | 'audio';

function App() {
  const [script, setScript] = useState<string>('');
  const [voices, setVoices] = useState<Voice[]>(ALL_VOICES);
  const [selectedVoice, setSelectedVoice] = useLocalStorage('mozhi_voice', 'en-US-JennyNeural');
  const [selectedSpeed, setSelectedSpeed] = useLocalStorage('mozhi_speed', '+0%');
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>('idle');
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 });
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>('script');
  const [useMockMode, setUseMockMode] = useState(false);

  // Voice switch confirmation prompt state
  const [pendingVoiceId, setPendingVoiceId] = useState<string | null>(null);
  const [isVoiceSwitchModalOpen, setIsVoiceSwitchModalOpen] = useState(false);

  // Integrated Audio Workstation State
  const [autoplayNext, setAutoplayNext] = useLocalStorage('mozhi_autoplay_next', true);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'info' | 'error'>('success');

  const showToast = useCallback((msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
  }, []);

  const parseResult = useMemo(() => parseScript(script), [script]);

  // Purge any legacy browser storage on fresh session
  useEffect(() => {
    try {
      localStorage.removeItem('mozhi_script_draft');
      localStorage.removeItem('mozhi_generated_files');
    } catch {
      // ignore
    }
  }, []);

  // Prevent accidental refresh / navigation when user has active script or generated audio
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (script.trim().length > 0 || files.length > 0) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [script, files.length]);

  // Load voices on mount
  useEffect(() => {
    fetchVoices().then((res) => {
      setVoices(res.voices);
    });
  }, []);

  // Check if backend is available
  useEffect(() => {
    fetch('/api/voices')
      .then((res) => {
        if (!res.ok) setUseMockMode(true);
      })
      .catch(() => setUseMockMode(true));
  }, []);

  const cleanupAudioUrls = useCallback((oldFiles: GeneratedFile[]) => {
    for (const f of oldFiles) {
      if (f.audioUrl && f.audioUrl.startsWith('blob:')) {
        try {
          window.URL.revokeObjectURL(f.audioUrl);
        } catch {
          // ignore
        }
      }
    }
  }, []);

  const handleGenerate = useCallback(
    async (voiceOverride?: string) => {
      if (script.trim().length === 0 || parseResult.totalSections === 0) {
        showToast('Please enter at least one slide section with # Slide_Name', 'info');
        return;
      }
      const voiceToUse = voiceOverride || selectedVoice;
      setGenerationStatus('generating');
      setGenerationProgress({ current: 0, total: parseResult.totalSections });
      setPlayingIndex(null);
      cleanupAudioUrls(files);
      setFiles([]);

      try {
        const response = await generateAudio(script, voiceToUse, selectedSpeed);
        setFiles(response.files);
        setGenerationStatus('success');
        setMobileTab('audio');
        const voiceObj = voices.find((v) => v.id === voiceToUse);
        const voiceLabel = voiceObj ? voiceObj.name : voiceToUse;
        showToast(`Generated ${response.files.length} slide tracks with ${voiceLabel} (${selectedSpeed})`, 'success');
      } catch (err: unknown) {
        console.error('Audio generation failed:', err);
        setGenerationStatus('error');
        const msg = err instanceof Error ? err.message : 'Audio generation failed. Please check backend connection.';
        showToast(msg, 'error');
      }
    },
    [script, parseResult, selectedVoice, selectedSpeed, voices, showToast, cleanupAudioUrls, files],
  );

  const handleVoiceChangeRequest = useCallback(
    (newVoiceId: string) => {
      if (newVoiceId === selectedVoice) return;

      setSelectedVoice(newVoiceId);
      const voiceObj = voices.find((item) => item.id === newVoiceId);
      const voiceName = voiceObj?.name || newVoiceId;

      // If slide audio tracks are already generated, prompt the user whether to regenerate all audio
      if (files.length > 0) {
        setPendingVoiceId(newVoiceId);
        setIsVoiceSwitchModalOpen(true);
      } else {
        showToast(`Voice set to ${voiceName}`, 'success');
      }
    },
    [selectedVoice, files.length, setSelectedVoice, voices, showToast],
  );

  const handleConfirmRegenerate = useCallback(async () => {
    const newVoice = pendingVoiceId || selectedVoice;
    setIsVoiceSwitchModalOpen(false);
    setPendingVoiceId(null);
    await handleGenerate(newVoice);
  }, [pendingVoiceId, selectedVoice, handleGenerate]);

  const handleConfirmSwitchOnly = useCallback(() => {
    setIsVoiceSwitchModalOpen(false);
    setPendingVoiceId(null);
    const voiceObj = voices.find((item) => item.id === selectedVoice);
    showToast(`Voice model active: ${voiceObj?.name || selectedVoice}`, 'info');
  }, [selectedVoice, voices, showToast]);

  const handleCloseVoiceModal = useCallback(() => {
    setIsVoiceSwitchModalOpen(false);
    setPendingVoiceId(null);
  }, []);

  const handleTogglePlay = useCallback(
    (index: number) => {
      setPlayingIndex((prev) => (prev === index ? null : index));
    },
    [],
  );

  const handleMasterTogglePlay = useCallback(() => {
    if (files.length === 0) return;
    if (playingIndex !== null) {
      setPlayingIndex(null);
    } else {
      setPlayingIndex(0);
    }
  }, [files.length, playingIndex]);

  const handleNextTrack = useCallback(() => {
    if (files.length === 0) return;
    setPlayingIndex((prev) => {
      if (prev === null) return 0;
      if (prev < files.length - 1) return prev + 1;
      return prev;
    });
  }, [files.length]);

  const handlePrevTrack = useCallback(() => {
    if (files.length === 0) return;
    setPlayingIndex((prev) => {
      if (prev === null || prev <= 0) return 0;
      return prev - 1;
    });
  }, [files.length]);

  const handleTrackEnded = useCallback(
    (endedIndex: number) => {
      if (autoplayNext && endedIndex < files.length - 1) {
        setPlayingIndex(endedIndex + 1);
      } else {
        setPlayingIndex(null);
      }
    },
    [autoplayNext, files.length],
  );

  const handlePlayAllFromStart = useCallback(() => {
    if (files.length === 0) return;
    setPlayingIndex(0);
    showToast('Playing full course from Slide 1', 'info');
  }, [files.length, showToast]);

  const handleExportZip = useCallback(async () => {
    if (files.length === 0) return;
    showToast('Preparing ZIP archive with audio & Storyline timeline specs...', 'info');
    await downloadAllAsZip(files);
  }, [files, showToast]);

  const handleRegenerate = useCallback(
    async (index: number) => {
      const file = files[index];
      if (!file) return;
      // Match by sectionName or fall back to section at corresponding index
      const section =
        parseResult.sections.find((s) => s.name === file.sectionName) ||
        parseResult.sections[index];
      if (!section) {
        showToast(`No matching slide script found for track ${index + 1}`, 'error');
        return;
      }

      const targetSectionName = section.name || file.sectionName;
      setRegeneratingIndex(index);
      try {
        const response = await generateSingleAudio(targetSectionName, section.text, selectedVoice, selectedSpeed);
        if (file.audioUrl && file.audioUrl.startsWith('blob:')) {
          try {
            window.URL.revokeObjectURL(file.audioUrl);
          } catch {
            // ignore
          }
        }
        setFiles((prev) => {
          const updated = [...prev];
          updated[index] = response.file;
          return updated;
        });
        const voiceObj = voices.find((v) => v.id === selectedVoice);
        showToast(`Regenerated ${targetSectionName} with ${voiceObj?.name || selectedVoice}`, 'success');
      } catch (err: unknown) {
        console.error('Single track regeneration failed:', err);
        const msg = err instanceof Error ? err.message : 'Regeneration failed.';
        showToast(msg, 'error');
      }
      setRegeneratingIndex(null);
    },
    [files, parseResult, selectedVoice, selectedSpeed, voices, showToast],
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // ? → Open Shortcuts Modal
      if (e.key === '?' && !['TEXTAREA', 'INPUT'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      }
      // Cmd/Ctrl + Enter → Generate All
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleGenerate();
      }
      // Spacebar → Toggle play/pause (only if not typing in textarea/input)
      if (e.key === ' ') {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'TEXTAREA' && target.tagName !== 'INPUT') {
          e.preventDefault();
          if (playingIndex !== null) {
            handleTogglePlay(playingIndex);
          } else if (files.length > 0) {
            setPlayingIndex(0);
          }
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleGenerate, handleTogglePlay, playingIndex, files.length]);

  return (
    <div className="flex flex-col h-screen bg-ground ambient-glow overflow-hidden select-none">
      <StudioHeader
        voices={voices}
        selectedVoice={selectedVoice}
        onVoiceChange={handleVoiceChangeRequest}
        selectedSpeed={selectedSpeed}
        onSpeedChange={setSelectedSpeed}
        onGenerate={handleGenerate}
        generationStatus={generationStatus}
        generationProgress={generationProgress}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex border-b border-border-subtle bg-surface-1 shrink-0">
        <button
          onClick={() => setMobileTab('script')}
          className={`flex items-center gap-1.5 flex-1 py-2.5 text-xs font-medium justify-center transition-colors ${
            mobileTab === 'script'
              ? 'text-accent-primary border-b-2 border-accent-primary bg-accent-primary/5'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          <PencilLine className="w-3.5 h-3.5" />
          Script
        </button>
        <button
          onClick={() => setMobileTab('audio')}
          className={`flex items-center gap-1.5 flex-1 py-2.5 text-xs font-medium justify-center transition-colors ${
            mobileTab === 'audio'
              ? 'text-accent-primary border-b-2 border-accent-primary bg-accent-primary/5'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          <Headphones className="w-3.5 h-3.5" />
          Audio {files.length > 0 && `(${files.length})`}
        </button>
      </div>

      {/* Studio Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: Script Workbench */}
        <div
          className={`${
            mobileTab === 'script' ? 'flex' : 'hidden'
          } lg:flex w-full lg:w-[48%] flex-col overflow-hidden`}
        >
          <ScriptWorkbench
            script={script}
            onScriptChange={setScript}
            parseResult={parseResult}
            onLoadSample={() => {
              cleanupAudioUrls(files);
              setScript(SAMPLE_SCRIPT);
              setFiles([]);
              setPlayingIndex(null);
              showToast('Sample e-learning course script loaded', 'info');
            }}
            onClear={() => {
              cleanupAudioUrls(files);
              setScript('');
              setFiles([]);
              setPlayingIndex(null);
              showToast('Script and audio tracks cleared', 'info');
            }}
          />
        </div>

        {/* Right Pane: Audio Deck */}
        <div
          className={`${
            mobileTab === 'audio' ? 'flex' : 'hidden'
          } lg:flex w-full lg:w-[52%] flex-col overflow-hidden`}
        >
          <AudioDeck
            files={files}
            sections={parseResult.sections}
            generationStatus={generationStatus}
            playingIndex={playingIndex}
            playbackRate={playbackRate}
            onTogglePlay={handleTogglePlay}
            onRegenerate={handleRegenerate}
            regeneratingIndex={regeneratingIndex}
            onTrackEnded={handleTrackEnded}
          />
        </div>
      </div>

      {/* Master Audio Workstation Player Bar */}
      {files.length > 0 && (
        <MasterPlayerBar
          files={files}
          activeIndex={playingIndex}
          isPlaying={playingIndex !== null}
          autoplayNext={autoplayNext}
          playbackRate={playbackRate}
          onTogglePlay={handleMasterTogglePlay}
          onNext={handleNextTrack}
          onPrev={handlePrevTrack}
          onToggleAutoplay={() => setAutoplayNext(!autoplayNext)}
          onChangePlaybackRate={setPlaybackRate}
          onExportZip={handleExportZip}
          onPlayAllFromStart={handlePlayAllFromStart}
        />
      )}

      {/* Toast Feedback Notification */}
      <Toast
        message={toastMessage}
        type={toastType}
        onClose={() => setToastMessage(null)}
      />

      {/* Keyboard Shortcuts Cheatsheet Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Voice Model Switch Confirmation Modal */}
      <VoiceSwitchModal
        isOpen={isVoiceSwitchModalOpen}
        onClose={handleCloseVoiceModal}
        oldVoiceId={selectedVoice}
        newVoiceId={pendingVoiceId || selectedVoice}
        voices={voices}
        trackCount={files.length}
        onConfirmRegenerate={handleConfirmRegenerate}
        onConfirmSwitchOnly={handleConfirmSwitchOnly}
      />
    </div>
  );
}

export default App;
