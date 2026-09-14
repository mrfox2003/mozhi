import JSZip from 'jszip';
import type { GeneratedFile } from '@/types';

export function formatTime(seconds: number): string {
  const safeSec = Math.max(0, isNaN(seconds) ? 0 : seconds);
  const mins = Math.floor(safeSec / 60);
  const secs = Math.floor(safeSec % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatSize(kb: number): string {
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function downloadFile(file: GeneratedFile) {
  let url = file.audioUrl;
  let shouldRevoke = false;

  if (file.audioBlob) {
    url = window.URL.createObjectURL(file.audioBlob);
    shouldRevoke = true;
  } else if (!url) {
    url = `/api/audio/${encodeURIComponent(file.filename)}`;
  }

  const a = document.createElement('a');
  a.href = url;
  a.download = file.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  if (shouldRevoke) {
    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
  }
}

export async function downloadAllAsZip(files: GeneratedFile[] = []): Promise<boolean> {
  if (files.length === 0) return false;

  try {
    const zip = new JSZip();

    // Pack all slide files in parallel
    for (const file of files) {
      if (file.audioBlob) {
        zip.file(file.filename, file.audioBlob);
      } else if (file.audioUrl) {
        // Fetch audio blob from URL if blob not cached directly
        const res = await fetch(file.audioUrl);
        if (res.ok) {
          const blob = await res.blob();
          zip.file(file.filename, blob);
        }
      }
    }

    // Generate zip binary directly in browser memory
    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    const url = window.URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mozhi_course_audio.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => window.URL.revokeObjectURL(url), 1500);
    return true;
  } catch (err) {
    console.error('Client-side ZIP generation error, attempting fallback:', err);
    try {
      const res = await fetch('/api/download-zip');
      if (!res.ok) throw new Error(`Server returned status ${res.status}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mozhi_course_audio.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      return true;
    } catch {
      return false;
    }
  }
}
