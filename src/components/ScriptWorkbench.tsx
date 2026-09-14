import { useRef, useEffect } from 'react';
import { Plus, FileText, Trash2, Hash, Type, Clock } from 'lucide-react';
import type { ParseResult } from '@/types';
import { SAMPLE_SCRIPT, insertSlideHeader } from '@/lib/scriptParser';

interface ScriptWorkbenchProps {
  script: string;
  onScriptChange: (script: string) => void;
  parseResult: ParseResult;
  onLoadSample: () => void;
  onClear: () => void;
}

export function ScriptWorkbench({
  script,
  onScriptChange,
  parseResult,
  onLoadSample,
  onClear,
}: ScriptWorkbenchProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Sync line numbers scroll with textarea
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Auto-scroll line numbers when content changes
  useEffect(() => {
    handleScroll();
  }, [script]);

  const handleInsertHeader = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const cursorPos = textarea.selectionStart;
    const slideNum = parseResult.totalSections + 1;
    const newScript = insertSlideHeader(script, cursorPos, slideNum);
    onScriptChange(newScript);
    // Set cursor after the inserted header
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        const newPos = cursorPos + `# Slide_${slideNum}_Title\n`.length;
        textareaRef.current.selectionStart = newPos;
        textareaRef.current.selectionEnd = newPos;
        textareaRef.current.focus();
      }
    });
  };

  const handleClear = () => {
    onClear();
  };

  const handleLoadSample = () => {
    onLoadSample();
  };

  // Render lines for line numbers, highlighting slide headers
  const lines = script.split('\n');
  const lineNumbers = lines.map((line, i) => {
    const isHeader = /^#+\s*/.test(line.trim());
    return isHeader ? (
      <div key={i} className="text-[#ff9138] font-bold">
        {i + 1}
      </div>
    ) : (
      <div key={i} className="text-text-muted/40">
        {i + 1}
      </div>
    );
  });

  return (
    <div className="flex flex-col h-full bg-surface-1/95 border-r border-border-warm">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-border-warm bg-surface-1 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider mr-1">
            Script Workbench
          </span>
          {parseResult.totalSections > 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#ed7002]/15 text-[#ff9138] border border-[#ed7002]/30">
              {parseResult.totalSections} {parseResult.totalSections === 1 ? 'Slide' : 'Slides'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleInsertHeader}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-3 border border-transparent hover:border-border-warm transition-all"
            title="Insert new # Slide_X_Title header"
          >
            <Plus className="w-3.5 h-3.5 text-[#ff9138]" />
            <span>Insert Slide</span>
          </button>
          <button
            onClick={handleLoadSample}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-3 border border-transparent hover:border-border-warm transition-all"
            title="Load sample e-learning voiceover script"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Sample</span>
          </button>
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-text-muted hover:text-error hover:bg-error/10 transition-all"
            title="Clear current script"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-hidden flex relative">
        {/* Line Numbers */}
        <div
          ref={lineNumbersRef}
          className="mozhi-editor select-none py-4 px-3 text-right overflow-hidden bg-surface-1/40 border-r border-border-warm shrink-0"
          style={{ minWidth: '48px' }}
        >
          {lineNumbers}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={script}
          onChange={(e) => onScriptChange(e.target.value)}
          onScroll={handleScroll}
          spellCheck={false}
          placeholder="# Slide_1_1_Intro&#10;Welcome to this course...&#10;&#10;# Slide_1_2_Core_Concepts&#10;In this module we explore..."
          className="mozhi-editor flex-1 resize-none bg-transparent text-text-primary py-4 px-4 placeholder:text-text-muted/30 leading-[1.7] outline-none"
          style={{ tabSize: 2 }}
        />
      </div>

      {/* Telemetry Bar */}
      <div className="flex items-center gap-5 px-4 py-2.5 border-t border-border-warm bg-surface-1/70 shrink-0">
        <div className="flex items-center gap-1.5">
          <Hash className="w-3.5 h-3.5 text-[#ff9138]" />
          <span className="text-xs font-mono text-text-secondary">
            <span className="text-text-primary font-bold">{parseResult.totalSections}</span> Slides
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Type className="w-3.5 h-3.5 text-[#38bdf8]" />
          <span className="text-xs font-mono text-text-secondary">
            <span className="text-text-primary font-bold">{parseResult.totalWords}</span> Words
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-accent-green" />
          <span className="text-xs font-mono text-text-secondary">
            <span className="text-text-primary font-bold">~{parseResult.estimatedDurationSec}s</span> Est.
          </span>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
          <span className="text-[10px] text-text-muted font-medium">Live Studio</span>
        </div>
      </div>
    </div>
  );
}
