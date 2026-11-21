import { useEffect, useState } from 'react';
import type { Settings } from '../state/settings';
import { toSpoken } from './spoken';

export const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

export function getPolishVoices(): SpeechSynthesisVoice[] {
  if (!speechSupported) return [];
  return window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('pl'));
}

export function useVoices() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() => getPolishVoices());
  useEffect(() => {
    if (!speechSupported) return;
    const update = () => setVoices(getPolishVoices());
    update();
    window.speechSynthesis.addEventListener('voiceschanged', update);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', update);
  }, []);
  return voices;
}

type SpeakOpts = Pick<Settings, 'rate' | 'pitch' | 'volume' | 'voiceURI'> & { onEnd?: () => void };

/** Czyta tekst (z notacją ułamków) polskim głosem. */
export function speak(text: string | string[], opts: SpeakOpts) {
  if (!speechSupported) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const parts = (Array.isArray(text) ? text : [text]).map(toSpoken).filter(Boolean);
  const voices = getPolishVoices();
  const voice = voices.find((v) => v.voiceURI === opts.voiceURI) ?? voices[0];
  parts.forEach((p, i) => {
    const u = new SpeechSynthesisUtterance(p);
    u.lang = 'pl-PL';
    if (voice) u.voice = voice;
    u.rate = opts.rate;
    u.pitch = opts.pitch;
    u.volume = opts.volume;
    if (i === parts.length - 1 && opts.onEnd) {
      u.onend = opts.onEnd;
      u.onerror = opts.onEnd;
    }
    synth.speak(u);
  });
}

export function stopSpeaking() {
  if (speechSupported) window.speechSynthesis.cancel();
}

/* --------- Delikatne dźwięki (WebAudio, bez plików) --------- */
let ctx: AudioContext | null = null;
export function chime(kind: 'correct' | 'wrong') {
  try {
    ctx ??= new AudioContext();
    const now = ctx.currentTime;
    const notes = kind === 'correct' ? [660, 880] : [330];
    notes.forEach((f, i) => {
      const o = ctx!.createOscillator();
      const g = ctx!.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(0, now + i * 0.12);
      g.gain.linearRampToValueAtTime(0.08, now + i * 0.12 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.5);
      o.connect(g).connect(ctx!.destination);
      o.start(now + i * 0.12);
      o.stop(now + i * 0.12 + 0.55);
    });
  } catch {
    /* brak obsługi audio */
  }
}
