import type { Voice, VoicePreset } from '@/types';

export interface RichVoicePreset {
  key: string;
  name: string;
  voiceId: string;
  accent: string;
  regionKey: string;
  region: string;
  regionFlag: string;
  gender: 'Female' | 'Male';
  flag: string;
  style: string;
}

export interface RegionOption {
  key: string;
  label: string;
  shortLabel: string;
  flag: string;
  localePrefixes: string[];
}

export const REGIONS: RegionOption[] = [
  { key: 'us', label: 'United States', shortLabel: 'USA', flag: '🇺🇸', localePrefixes: ['en-US'] },
  { key: 'in', label: 'India (EN, TA, HI)', shortLabel: 'India', flag: '🇮🇳', localePrefixes: ['en-IN', 'ta-IN', 'hi-IN', 'te-IN', 'mr-IN', 'bn-IN', 'gu-IN', 'kn-IN', 'ml-IN', 'ur-IN'] },
  { key: 'uk', label: 'United Kingdom', shortLabel: 'UK', flag: '🇬🇧', localePrefixes: ['en-GB'] },
  { key: 'au', label: 'Australia', shortLabel: 'Australia', flag: '🇦🇺', localePrefixes: ['en-AU'] },
  { key: 'ca', label: 'Canada', shortLabel: 'Canada', flag: '🇨🇦', localePrefixes: ['en-CA', 'fr-CA'] },
  { key: 'eu', label: 'Europe (FR, DE, ES, IT)', shortLabel: 'Europe', flag: '🇪🇺', localePrefixes: ['fr-FR', 'de-DE', 'es-ES', 'it-IT', 'nl-NL', 'pl-PL', 'sv-SE'] },
  { key: 'ap', label: 'Asia-Pacific (JP, KR, SG)', shortLabel: 'Asia-Pac', flag: '🌏', localePrefixes: ['ja-JP', 'ko-KR', 'zh-CN', 'en-SG', 'zh-HK', 'zh-TW'] },
  { key: 'all', label: 'All Regions (Global)', shortLabel: 'All Global', flag: '🌐', localePrefixes: [] },
];

export const CURATED_PRESETS: RichVoicePreset[] = [
  // United States
  {
    key: 'us-female',
    name: 'Jenny',
    voiceId: 'en-US-JennyNeural',
    accent: 'US Female',
    regionKey: 'us',
    region: 'United States',
    regionFlag: '🇺🇸',
    gender: 'Female',
    flag: '🇺🇸',
    style: 'Warm & Natural',
  },
  {
    key: 'us-male',
    name: 'Guy',
    voiceId: 'en-US-GuyNeural',
    accent: 'US Male',
    regionKey: 'us',
    region: 'United States',
    regionFlag: '🇺🇸',
    gender: 'Male',
    flag: '🇺🇸',
    style: 'Clear & Narrative',
  },
  {
    key: 'us-aria',
    name: 'Aria',
    voiceId: 'en-US-AriaNeural',
    accent: 'US Female',
    regionKey: 'us',
    region: 'United States',
    regionFlag: '🇺🇸',
    gender: 'Female',
    flag: '🇺🇸',
    style: 'Expressive & Bright',
  },
  {
    key: 'us-davis',
    name: 'Davis',
    voiceId: 'en-US-DavisNeural',
    accent: 'US Male',
    regionKey: 'us',
    region: 'United States',
    regionFlag: '🇺🇸',
    gender: 'Male',
    flag: '🇺🇸',
    style: 'Deep & Authoritative',
  },
  // India & Regional
  {
    key: 'in-female',
    name: 'Neerja',
    voiceId: 'en-IN-NeerjaNeural',
    accent: 'Indian English',
    regionKey: 'in',
    region: 'India & Regional',
    regionFlag: '🇮🇳',
    gender: 'Female',
    flag: '🇮🇳',
    style: 'Professional & Crisp',
  },
  {
    key: 'in-male',
    name: 'Prabhat',
    voiceId: 'en-IN-PrabhatNeural',
    accent: 'Indian English',
    regionKey: 'in',
    region: 'India & Regional',
    regionFlag: '🇮🇳',
    gender: 'Male',
    flag: '🇮🇳',
    style: 'Engaging Instructor',
  },
  {
    key: 'ta-male',
    name: 'Valluvar',
    voiceId: 'ta-IN-ValluvarNeural',
    accent: 'Tamil Classical',
    regionKey: 'in',
    region: 'India & Regional',
    regionFlag: '🇮🇳',
    gender: 'Male',
    flag: '🇮🇳',
    style: 'Classical & Deep',
  },
  {
    key: 'ta-female',
    name: 'Pallavi',
    voiceId: 'ta-IN-PallaviNeural',
    accent: 'Tamil Modern',
    regionKey: 'in',
    region: 'India & Regional',
    regionFlag: '🇮🇳',
    gender: 'Female',
    flag: '🇮🇳',
    style: 'Gentle & Melodic',
  },
  {
    key: 'hi-female',
    name: 'Swara',
    voiceId: 'hi-IN-SwaraNeural',
    accent: 'Hindi Modern',
    regionKey: 'in',
    region: 'India & Regional',
    regionFlag: '🇮🇳',
    gender: 'Female',
    flag: '🇮🇳',
    style: 'Clear & Modern',
  },
  {
    key: 'hi-male',
    name: 'Madhur',
    voiceId: 'hi-IN-MadhurNeural',
    accent: 'Hindi Classical',
    regionKey: 'in',
    region: 'India & Regional',
    regionFlag: '🇮🇳',
    gender: 'Male',
    flag: '🇮🇳',
    style: 'Deep & Inspiring',
  },
  // United Kingdom
  {
    key: 'uk-libby',
    name: 'Libby',
    voiceId: 'en-GB-LibbyNeural',
    accent: 'British English',
    regionKey: 'uk',
    region: 'United Kingdom',
    regionFlag: '🇬🇧',
    gender: 'Female',
    flag: '🇬🇧',
    style: 'Natural & Crisp',
  },
  {
    key: 'uk-female',
    name: 'Sonia',
    voiceId: 'en-GB-SoniaNeural',
    accent: 'British English',
    regionKey: 'uk',
    region: 'United Kingdom',
    regionFlag: '🇬🇧',
    gender: 'Female',
    flag: '🇬🇧',
    style: 'Sophisticated & Formal',
  },
  {
    key: 'uk-maisie',
    name: 'Maisie',
    voiceId: 'en-GB-MaisieNeural',
    accent: 'British English',
    regionKey: 'uk',
    region: 'United Kingdom',
    regionFlag: '🇬🇧',
    gender: 'Female',
    flag: '🇬🇧',
    style: 'Friendly & Youthful',
  },
  {
    key: 'uk-male',
    name: 'Ryan',
    voiceId: 'en-GB-RyanNeural',
    accent: 'British English',
    regionKey: 'uk',
    region: 'United Kingdom',
    regionFlag: '🇬🇧',
    gender: 'Male',
    flag: '🇬🇧',
    style: 'Confident & Smooth',
  },
  {
    key: 'uk-thomas',
    name: 'Thomas',
    voiceId: 'en-GB-ThomasNeural',
    accent: 'British English',
    regionKey: 'uk',
    region: 'United Kingdom',
    regionFlag: '🇬🇧',
    gender: 'Male',
    flag: '🇬🇧',
    style: 'Deep & Authoritative',
  },
  // Australia
  {
    key: 'au-female',
    name: 'Natasha',
    voiceId: 'en-AU-NatashaNeural',
    accent: 'Australian English',
    regionKey: 'au',
    region: 'Australia',
    regionFlag: '🇦🇺',
    gender: 'Female',
    flag: '🇦🇺',
    style: 'Friendly & Casual',
  },
  {
    key: 'au-male',
    name: 'William',
    voiceId: 'en-AU-WilliamNeural',
    accent: 'Australian English',
    regionKey: 'au',
    region: 'Australia',
    regionFlag: '🇦🇺',
    gender: 'Male',
    flag: '🇦🇺',
    style: 'Warm & Professional',
  },
  // Canada
  {
    key: 'ca-female',
    name: 'Clara',
    voiceId: 'en-CA-ClaraNeural',
    accent: 'Canadian English',
    regionKey: 'ca',
    region: 'Canada',
    regionFlag: '🇨🇦',
    gender: 'Female',
    flag: '🇨🇦',
    style: 'Natural & Pleasant',
  },
  {
    key: 'ca-male',
    name: 'Liam',
    voiceId: 'en-CA-LiamNeural',
    accent: 'Canadian English',
    regionKey: 'ca',
    region: 'Canada',
    regionFlag: '🇨🇦',
    gender: 'Male',
    flag: '🇨🇦',
    style: 'Authoritative & Calm',
  },
  // Europe
  {
    key: 'fr-female',
    name: 'Denise',
    voiceId: 'fr-FR-DeniseNeural',
    accent: 'French',
    regionKey: 'eu',
    region: 'Europe',
    regionFlag: '🇫🇷',
    gender: 'Female',
    flag: '🇫🇷',
    style: 'Smooth & Elegant',
  },
  {
    key: 'fr-male',
    name: 'Henri',
    voiceId: 'fr-FR-HenriNeural',
    accent: 'French',
    regionKey: 'eu',
    region: 'Europe',
    regionFlag: '🇫🇷',
    gender: 'Male',
    flag: '🇫🇷',
    style: 'Warm & Articulate',
  },
  {
    key: 'de-female',
    name: 'Katja',
    voiceId: 'de-DE-KatjaNeural',
    accent: 'German',
    regionKey: 'eu',
    region: 'Europe',
    regionFlag: '🇩🇪',
    gender: 'Female',
    flag: '🇩🇪',
    style: 'Clear & Professional',
  },
  {
    key: 'de-male',
    name: 'Conrad',
    voiceId: 'de-DE-ConradNeural',
    accent: 'German',
    regionKey: 'eu',
    region: 'Europe',
    regionFlag: '🇩🇪',
    gender: 'Male',
    flag: '🇩🇪',
    style: 'Direct & Authoritative',
  },
  {
    key: 'es-female',
    name: 'Elvira',
    voiceId: 'es-ES-ElviraNeural',
    accent: 'Spanish',
    regionKey: 'eu',
    region: 'Europe',
    regionFlag: '🇪🇸',
    gender: 'Female',
    flag: '🇪🇸',
    style: 'Expressive & Melodic',
  },
  {
    key: 'es-male',
    name: 'Alvaro',
    voiceId: 'es-ES-AlvaroNeural',
    accent: 'Spanish',
    regionKey: 'eu',
    region: 'Europe',
    regionFlag: '🇪🇸',
    gender: 'Male',
    flag: '🇪🇸',
    style: 'Dynamic & Friendly',
  },
  {
    key: 'it-female',
    name: 'Elsa',
    voiceId: 'it-IT-ElsaNeural',
    accent: 'Italian',
    regionKey: 'eu',
    region: 'Europe',
    regionFlag: '🇮🇹',
    gender: 'Female',
    flag: '🇮🇹',
    style: 'Lively & Warm',
  },
  {
    key: 'it-male',
    name: 'Diego',
    voiceId: 'it-IT-DiegoNeural',
    accent: 'Italian',
    regionKey: 'eu',
    region: 'Europe',
    regionFlag: '🇮🇹',
    gender: 'Male',
    flag: '🇮🇹',
    style: 'Rich & Narrative',
  },
  // Asia-Pacific
  {
    key: 'ja-female',
    name: 'Nanami',
    voiceId: 'ja-JP-NanamiNeural',
    accent: 'Japanese',
    regionKey: 'ap',
    region: 'Asia-Pacific',
    regionFlag: '🇯🇵',
    gender: 'Female',
    flag: '🇯🇵',
    style: 'Gentle & Natural',
  },
  {
    key: 'ja-male',
    name: 'Keita',
    voiceId: 'ja-JP-KeitaNeural',
    accent: 'Japanese',
    regionKey: 'ap',
    region: 'Asia-Pacific',
    regionFlag: '🇯🇵',
    gender: 'Male',
    flag: '🇯🇵',
    style: 'Calm & Professional',
  },
  {
    key: 'ko-female',
    name: 'SunHi',
    voiceId: 'ko-KR-SunHiNeural',
    accent: 'Korean',
    regionKey: 'ap',
    region: 'Asia-Pacific',
    regionFlag: '🇰🇷',
    gender: 'Female',
    flag: '🇰🇷',
    style: 'Bright & Clear',
  },
  {
    key: 'ko-male',
    name: 'InJoon',
    voiceId: 'ko-KR-InJoonNeural',
    accent: 'Korean',
    regionKey: 'ap',
    region: 'Asia-Pacific',
    regionFlag: '🇰🇷',
    gender: 'Male',
    flag: '🇰🇷',
    style: 'Youthful & Engaging',
  },
  {
    key: 'zh-female',
    name: 'Xiaoxiao',
    voiceId: 'zh-CN-XiaoxiaoNeural',
    accent: 'Mandarin Chinese',
    regionKey: 'ap',
    region: 'Asia-Pacific',
    regionFlag: '🇨🇳',
    gender: 'Female',
    flag: '🇨🇳',
    style: 'Warm & Expressive',
  },
  {
    key: 'zh-male',
    name: 'Yunxi',
    voiceId: 'zh-CN-YunxiNeural',
    accent: 'Mandarin Chinese',
    regionKey: 'ap',
    region: 'Asia-Pacific',
    regionFlag: '🇨🇳',
    gender: 'Male',
    flag: '🇨🇳',
    style: 'Narrative & Smooth',
  },
];

export const VOICE_PRESETS: VoicePreset[] = CURATED_PRESETS.map((p) => ({
  key: p.key,
  label: p.accent,
  voiceId: p.voiceId,
}));

export const ALL_VOICES: Voice[] = [
  // en-US
  { id: 'en-US-JennyNeural', name: 'Jenny', gender: 'Female', locale: 'en-US' },
  { id: 'en-US-GuyNeural', name: 'Guy', gender: 'Male', locale: 'en-US' },
  { id: 'en-US-AriaNeural', name: 'Aria', gender: 'Female', locale: 'en-US' },
  { id: 'en-US-DavisNeural', name: 'Davis', gender: 'Male', locale: 'en-US' },
  { id: 'en-US-AnaNeural', name: 'Ana', gender: 'Female', locale: 'en-US' },
  { id: 'en-US-MichelleNeural', name: 'Michelle', gender: 'Female', locale: 'en-US' },
  { id: 'en-US-JasonNeural', name: 'Jason', gender: 'Male', locale: 'en-US' },
  { id: 'en-US-TonyNeural', name: 'Tony', gender: 'Male', locale: 'en-US' },
  // en-IN / ta-IN / hi-IN
  { id: 'en-IN-NeerjaNeural', name: 'Neerja', gender: 'Female', locale: 'en-IN' },
  { id: 'en-IN-PrabhatNeural', name: 'Prabhat', gender: 'Male', locale: 'en-IN' },
  { id: 'ta-IN-ValluvarNeural', name: 'Valluvar', gender: 'Male', locale: 'ta-IN' },
  { id: 'ta-IN-PallaviNeural', name: 'Pallavi', gender: 'Female', locale: 'ta-IN' },
  { id: 'hi-IN-SwaraNeural', name: 'Swara', gender: 'Female', locale: 'hi-IN' },
  { id: 'hi-IN-MadhurNeural', name: 'Madhur', gender: 'Male', locale: 'hi-IN' },
  // en-GB
  { id: 'en-GB-LibbyNeural', name: 'Libby', gender: 'Female', locale: 'en-GB' },
  { id: 'en-GB-SoniaNeural', name: 'Sonia', gender: 'Female', locale: 'en-GB' },
  { id: 'en-GB-MaisieNeural', name: 'Maisie', gender: 'Female', locale: 'en-GB' },
  { id: 'en-GB-RyanNeural', name: 'Ryan', gender: 'Male', locale: 'en-GB' },
  { id: 'en-GB-ThomasNeural', name: 'Thomas', gender: 'Male', locale: 'en-GB' },
  // en-AU
  { id: 'en-AU-NatashaNeural', name: 'Natasha', gender: 'Female', locale: 'en-AU' },
  { id: 'en-AU-WilliamNeural', name: 'William', gender: 'Male', locale: 'en-AU' },
  // en-CA
  { id: 'en-CA-ClaraNeural', name: 'Clara', gender: 'Female', locale: 'en-CA' },
  { id: 'en-CA-LiamNeural', name: 'Liam', gender: 'Male', locale: 'en-CA' },
  // Europe
  { id: 'fr-FR-DeniseNeural', name: 'Denise', gender: 'Female', locale: 'fr-FR' },
  { id: 'fr-FR-HenriNeural', name: 'Henri', gender: 'Male', locale: 'fr-FR' },
  { id: 'de-DE-KatjaNeural', name: 'Katja', gender: 'Female', locale: 'de-DE' },
  { id: 'de-DE-ConradNeural', name: 'Conrad', gender: 'Male', locale: 'de-DE' },
  { id: 'es-ES-ElviraNeural', name: 'Elvira', gender: 'Female', locale: 'es-ES' },
  { id: 'es-ES-AlvaroNeural', name: 'Alvaro', gender: 'Male', locale: 'es-ES' },
  { id: 'it-IT-ElsaNeural', name: 'Elsa', gender: 'Female', locale: 'it-IT' },
  { id: 'it-IT-DiegoNeural', name: 'Diego', gender: 'Male', locale: 'it-IT' },
  // Asia-Pacific
  { id: 'ja-JP-NanamiNeural', name: 'Nanami', gender: 'Female', locale: 'ja-JP' },
  { id: 'ja-JP-KeitaNeural', name: 'Keita', gender: 'Male', locale: 'ja-JP' },
  { id: 'ko-KR-SunHiNeural', name: 'SunHi', gender: 'Female', locale: 'ko-KR' },
  { id: 'ko-KR-InJoonNeural', name: 'InJoon', gender: 'Male', locale: 'ko-KR' },
  { id: 'zh-CN-XiaoxiaoNeural', name: 'Xiaoxiao', gender: 'Female', locale: 'zh-CN' },
  { id: 'zh-CN-YunxiNeural', name: 'Yunxi', gender: 'Male', locale: 'zh-CN' },
  { id: 'en-SG-LunaNeural', name: 'Luna', gender: 'Female', locale: 'en-SG' },
];

export const SPEED_OPTIONS: { label: string; value: string }[] = [
  { label: '-15%', value: '-15%' },
  { label: '-10%', value: '-10%' },
  { label: 'Normal', value: '+0%' },
  { label: '+10%', value: '+10%' },
  { label: '+15%', value: '+15%' },
];

export function getRegionForVoice(voiceId: string, voices: Voice[]): string {
  const preset = CURATED_PRESETS.find((p) => p.voiceId === voiceId);
  if (preset) return preset.regionKey;

  const voice = voices.find((v) => v.id === voiceId);
  const locale = voice?.locale || voiceId;

  for (const reg of REGIONS) {
    if (reg.key === 'all') continue;
    if (reg.localePrefixes.some((p) => locale.toLowerCase().startsWith(p.toLowerCase()))) {
      return reg.key;
    }
  }
  return 'us';
}

export function getDefaultVoiceForRegion(regionKey: string, voices: Voice[]): string {
  const preset = CURATED_PRESETS.find((p) => p.regionKey === regionKey);
  if (preset) return preset.voiceId;

  const region = REGIONS.find((r) => r.key === regionKey);
  if (region && region.localePrefixes.length > 0) {
    const match = voices.find((v) =>
      region.localePrefixes.some((p) => v.locale.toLowerCase().startsWith(p.toLowerCase()))
    );
    if (match) return match.id;
  }

  return voices[0]?.id || 'en-US-JennyNeural';
}

export function groupVoicesByLocale(voices: Voice[]): Map<string, Voice[]> {
  const groups = new Map<string, Voice[]>();
  for (const v of voices) {
    if (!groups.has(v.locale)) groups.set(v.locale, []);
    groups.get(v.locale)!.push(v);
  }
  return groups;
}
