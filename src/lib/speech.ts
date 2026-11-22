import { Capacitor } from '@capacitor/core';
import { QueueStrategy, TextToSpeech } from '@capacitor-community/text-to-speech';
import { useEffect, useState } from 'react';
import type { Settings } from '../state/settings';
import { toSpoken } from './spoken';
import { isNeuralReady, neuralSupported, speakNeural, stopNeural } from './neuralVoice';

/**
 * Lektor: w przeglądarce Web Speech API, w aplikacji Android natywny
 * silnik mowy (WebView na Androidzie nie obsługuje speechSynthesis).
 */
const isNative = Capacitor.isNativePlatform();
const webSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window;

export const speechSupported = isNative || webSpeech || neuralSupported;

export type VoiceOption = { voiceURI: string; name: string; index: number };

let nativeVoices: VoiceOption[] = [];

async function loadNativeVoices(): Promise<VoiceOption[]> {
  try {
    const { voices } = await TextToSpeech.getSupportedVoices();
    nativeVoices = voices
      .map((v, index) => ({ voiceURI: v.voiceURI, name: v.name, lang: v.lang, index }))
      .filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith('pl'))
      .map(({ voiceURI, name, index }) => ({ voiceURI, name, index }));
  } catch {
    nativeVoices = [];
  }
  return nativeVoices;
}

function webPolishVoices(): SpeechSynthesisVoice[] {
  if (!webSpeech) return [];
  return window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('pl'));
}

export function useVoices(): VoiceOption[] {
  const [voices, setVoices] = useState<VoiceOption[]>(() => (isNative ? nativeVoices : webPolishVoices().map((v, index) => ({ voiceURI: v.voiceURI, name: v.name, index }))));
  useEffect(() => {
    if (isNative) {
      void loadNativeVoices().then(setVoices);
      return;
    }
    if (!webSpeech) return;
    const update = () => setVoices(webPolishVoices().map((v, index) => ({ voiceURI: v.voiceURI, name: v.name, index })));
    update();
    window.speechSynthesis.addEventListener('voiceschanged', update);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', update);
  }, []);
  return voices;
}

type SpeakOpts = Pick<Settings, 'rate' | 'pitch' | 'volume' | 'voiceURI'> & Partial<Pick<Settings, 'voiceEngine' | 'neuralVoice'>> & { onEnd?: () => void };

let speakToken = 0;

/** Czyta tekst (z notacją ułamków) polskim głosem. */
export function speak(text: string | string[], opts: SpeakOpts) {
  const parts = (Array.isArray(text) ? text : [text]).map(toSpoken).filter(Boolean);
  // Naturalny głos (Piper), jeśli jest pobrany; przy błędzie – głos systemowy
  if (opts.voiceEngine !== 'system' && opts.neuralVoice && neuralSupported && isNeuralReady(opts.neuralVoice)) {
    stopSystem();
    void speakNeural(parts, { voice: opts.neuralVoice, rate: opts.rate, volume: opts.volume, onEnd: opts.onEnd }).then((ok) => {
      if (!ok) speakSystem(parts, opts);
    });
    return;
  }
  speakSystem(parts, opts);
}

function speakSystem(parts: string[], opts: SpeakOpts) {
  if (isNative) {
    const token = ++speakToken;
    void (async () => {
      try {
        await TextToSpeech.stop();
        if (!nativeVoices.length) await loadNativeVoices();
        const voice = nativeVoices.find((v) => v.voiceURI === opts.voiceURI)?.index;
        for (const p of parts) {
          if (token !== speakToken) return;
          await TextToSpeech.speak({ text: p, lang: 'pl-PL', rate: opts.rate, pitch: opts.pitch, volume: opts.volume, voice, queueStrategy: QueueStrategy.Flush });
        }
      } catch {
        /* brak silnika mowy – aplikacja działa dalej bez lektora */
      } finally {
        if (token === speakToken) opts.onEnd?.();
      }
    })();
    return;
  }
  if (!webSpeech) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const voices = webPolishVoices();
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
  stopNeural();
  stopSystem();
}

function stopSystem() {
  if (isNative) {
    speakToken++;
    void TextToSpeech.stop().catch(() => {});
    return;
  }
  if (webSpeech) window.speechSynthesis.cancel();
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
