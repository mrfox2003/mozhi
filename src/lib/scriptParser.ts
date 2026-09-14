import type { ParseResult, ScriptSection } from '@/types';

const WORDS_PER_MINUTE = 140;

export function parseScript(script: string): ParseResult {
  const lines = script.split('\n');
  const sections: ScriptSection[] = [];
  let currentName: string | null = null;
  let currentLines: string[] = [];

  const flush = () => {
    let text = currentLines.join('\n').trim();
    if (!text && currentName) {
      text = currentName;
    }
    if (text || currentName) {
      const secName = currentName
        ? currentName.replace(/[\\/*?:"<>|]/g, '').trim()
        : sections.length === 0
        ? 'Slide_1_Intro'
        : `Slide_${sections.length + 1}`;
      const finalText = text || secName;
      const words = finalText ? finalText.split(/\s+/).filter(Boolean) : [];
      const wordCount = words.length;
      const estDurationSec = (wordCount / WORDS_PER_MINUTE) * 60;
      sections.push({
        name: secName,
        text: finalText,
        wordCount,
        estDurationSec: Math.round(estDurationSec * 10) / 10,
      });
    }
    currentName = null;
    currentLines = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    // Matches # Header, #Header, ## Header, ### Header
    const match = trimmed.match(/^#+\s*(.+)$/);
    if (match) {
      flush();
      currentName = match[1].trim();
    } else {
      currentLines.push(line);
    }
  }
  flush();

  // If no headers and plain text was provided, create a default Slide_1 section
  if (sections.length === 0 && script.trim().length > 0) {
    const text = script.trim();
    const words = text.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const estDurationSec = (wordCount / WORDS_PER_MINUTE) * 60;
    sections.push({
      name: 'Slide_1',
      text,
      wordCount,
      estDurationSec: Math.round(estDurationSec * 10) / 10,
    });
  }

  const totalWords = sections.reduce((s, sec) => s + sec.wordCount, 0);
  const estimatedDurationSec = Math.round((totalWords / WORDS_PER_MINUTE) * 60 * 10) / 10;

  return {
    totalSections: sections.length,
    totalWords,
    estimatedDurationSec,
    sections,
  };
}

export function insertSlideHeader(script: string, cursorPos: number, slideNum: number): string {
  const before = script.slice(0, cursorPos);
  const after = script.slice(cursorPos);
  const header = `# Slide_${slideNum}_Title\n`;

  // Ensure newline separation
  let prefix = before;
  if (prefix.length > 0 && !prefix.endsWith('\n')) {
    prefix += '\n';
  }
  return prefix + header + after;
}

export const SAMPLE_SCRIPT = `# Slide_1_1_Intro
Welcome to this course on Effective Communication in the Workplace. In this module, we'll explore the fundamentals of clear, professional communication and how it drives collaboration across teams.

# Slide_1_2_Core_Concepts
Let's begin with the core concepts. Communication is more than just words — it includes tone, body language, and active listening. Research shows that over seventy percent of workplace misunderstandings stem from unclear messaging, not from a lack of effort.

# Slide_1_3_Practical_Techniques
Here are three practical techniques you can apply immediately. First, structure your messages with a clear opening, a concise body, and a specific call to action. Second, confirm understanding by asking the listener to summarize. Third, choose the right channel — complex topics deserve a call, not a chat message.

# Slide_1_4_Summary
Let's review the key takeaways. Effective communication requires intention, structure, and the right medium. By practicing these techniques consistently, you'll reduce misunderstandings and build stronger professional relationships. In the next module, we'll dive into written communication best practices.`;
