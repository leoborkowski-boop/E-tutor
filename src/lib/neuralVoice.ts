/**
 * Naturalny głos lektora: polskie głosy Piper (sieć neuronowa) działające
 * w przeglądarce, bez serwera i bez opłat. Model (~60 MB) pobiera się raz
 * i zostaje w pamięci urządzenia (OPFS), potem działa także bez internetu.
 *
 * Gdy model nie jest pobrany albo coś się nie uda, aplikacja używa głosu
 * systemowego (speech.ts).
 */
import { useEffect, useState } from 'react';

export type NeuralVoiceId = 'pl_PL-gosia-medium' | 'pl_PL-darkman-medium' | 'pl_PL-mc_speech-medium';

export const NEURAL_VOICES: { id: NeuralVoiceId; name: string; about: string }[] = [
  { id: 'pl_PL-gosia-medium', name: 'Gosia', about: 'głos kobiecy, spokojny' },
  { id: 'pl_PL-darkman-medium', name: 'Darek', about: 'głos męski, wyraźny' },
  { id: 'pl_PL-mc_speech-medium', name: 'Marek', about: 'głos męski, ciepły' },
];

type PiperLib = typeof import('@mintplex-labs/piper-tts-web');
type Session = Awaited<ReturnType<PiperLib['TtsSession']['create']>>;

// W wersji do udostępniania linkiem (claude.ai) przeglądarka blokuje pobieranie modelu – zostaje głos systemowy
export const neuralSupported =
  import.meta.env.MODE !== 'artifact' &&
  typeof window !== 'undefined' && typeof WebAssembly === 'object' && typeof navigator !== 'undefined' && !!navigator.storage?.getDirectory;

/* ---------------- Stan (pobieranie, gotowe głosy) ---------------- */

export type NeuralState = {
  /** głosy zapisane na urządzeniu */
  ready: NeuralVoiceId[];
  downloading: NeuralVoiceId | null;
  /** 0–1 */
  progress: number;
  error: string | null;
};

let state: NeuralState = { ready: [], downloading: null, progress: 0, error: null };
const listeners = new Set<(s: NeuralState) => void>();
function setState(patch: Partial<NeuralState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l(state));
}

export function useNeuralState(): NeuralState {
  const [s, set] = useState(state);
  useEffect(() => {
    listeners.add(set);
    return () => void listeners.delete(set);
  }, []);
  return s;
}

let libPromise: Promise<PiperLib> | null = null;
/** Biblioteka ładowana dopiero przy pierwszym użyciu – nie spowalnia startu aplikacji. */
function lib() {
  libPromise ??= import('@mintplex-labs/piper-tts-web');
  return libPromise;
}

/** Sprawdza, które głosy są już pobrane (wywołać raz przy starcie). */
export async function initNeural() {
  if (!neuralSupported) return;
  try {
    const stored = (await (await lib()).stored()) as string[];
    setState({ ready: NEURAL_VOICES.map((v) => v.id).filter((id) => stored.includes(id)) });
  } catch {
    /* brak dostępu do pamięci – zostaje głos systemowy */
  }
}

export function isNeuralReady(voice: NeuralVoiceId) {
  return state.ready.includes(voice);
}

/**
 * Pobiera model głosu i zapisuje go w pamięci urządzenia (OPFS, katalog „piper”,
 * z którego czyta biblioteka). Własna implementacja, bo `download()` z biblioteki
 * nie czeka na zakończenie zapisu – głos mógł zostać odczytany w połowie.
 */
export async function downloadVoice(voice: NeuralVoiceId) {
  if (!neuralSupported || state.downloading) return;
  setState({ downloading: voice, progress: 0, error: null });
  try {
    const { HF_BASE, PATH_MAP } = await lib();
    const path = (PATH_MAP as Record<string, string>)[voice];
    const dir = await (await navigator.storage.getDirectory()).getDirectoryHandle('piper', { create: true });
    // najpierw mały plik konfiguracji, na końcu model – obecność .onnx oznacza pełne pobranie
    for (const url of [`${HF_BASE}/${path}.json`, `${HF_BASE}/${path}`]) {
      const res = await fetch(url);
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      const total = Number(res.headers.get('Content-Length') ?? 0);
      const reader = res.body.getReader();
      const chunks: BlobPart[] = [];
      let loaded = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        loaded += value.length;
        if (url.endsWith('.onnx') && total > 0) setState({ progress: Math.min(0.99, loaded / total) });
      }
      if (total > 0 && loaded !== total) throw new Error('Niepełne pobieranie');
      const file = await dir.getFileHandle(url.split('/').at(-1)!, { create: true });
      const w = await file.createWritable();
      await w.write(new Blob(chunks));
      await w.close();
    }
    session = null;
    sessionVoice = null;
    sessionPromise = null;
    setState({ ready: [...new Set([...state.ready, voice])], downloading: null, progress: 1 });
  } catch {
    setState({ downloading: null, error: 'Nie udało się pobrać głosu. Sprawdź połączenie z internetem i spróbuj ponownie.' });
  }
}

export async function removeVoice(voice: NeuralVoiceId) {
  try {
    await (await lib()).remove(voice);
  } finally {
    setState({ ready: state.ready.filter((v) => v !== voice) });
    if (sessionVoice === voice) {
      session = null;
      sessionVoice = null;
    }
  }
}

/* ---------------- Synteza i odtwarzanie ---------------- */

let session: Session | null = null;
let sessionVoice: NeuralVoiceId | null = null;
let sessionPromise: Promise<Session> | null = null;

async function getSession(voice: NeuralVoiceId): Promise<Session> {
  if (session && sessionVoice === voice) return session;
  if (sessionPromise && sessionVoice === voice) return sessionPromise;
  const { TtsSession } = await lib();
  // biblioteka trzyma jedną sesję – przy zmianie głosu tworzymy nową
  (TtsSession as unknown as { _instance: unknown })._instance = null;
  sessionVoice = voice;
  sessionPromise = TtsSession.create({ voiceId: voice })
    .then((s) => (session = s))
    .catch(async (e) => {
      sessionPromise = null;
      sessionVoice = null;
      (TtsSession as unknown as { _instance: unknown })._instance = null;
      await removeVoice(voice); // uszkodzony plik – pozwól pobrać ponownie
      throw e;
    });
  return sessionPromise;
}

/** Pamięć podręczna nagrań: ten sam tekst nie jest syntetyzowany drugi raz. */
const cache = new Map<string, string>();
async function synth(text: string, voice: NeuralVoiceId): Promise<string> {
  const key = `${voice}|${text}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const blob = await (await getSession(voice)).predict(text);
  const url = URL.createObjectURL(blob);
  cache.set(key, url);
  if (cache.size > 80) {
    const [oldKey, oldUrl] = cache.entries().next().value as [string, string];
    cache.delete(oldKey);
    URL.revokeObjectURL(oldUrl);
  }
  return url;
}

let token = 0;
let audio: HTMLAudioElement | null = null;

function play(url: string, rate: number, volume: number, my: number): Promise<void> {
  return new Promise((resolve) => {
    if (my !== token) return resolve();
    const a = new Audio(url);
    audio = a;
    a.playbackRate = rate;
    (a as HTMLAudioElement & { preservesPitch?: boolean }).preservesPitch = true;
    a.volume = volume;
    a.onended = () => resolve();
    a.onerror = () => resolve();
    a.onpause = () => resolve();
    a.play().catch(() => resolve());
  });
}

/**
 * Czyta fragmenty tekstu naturalnym głosem. Następny fragment jest
 * przygotowywany w czasie odtwarzania bieżącego.
 * Zwraca false, jeśli głos nie jest gotowy lub synteza się nie udała.
 */
export async function speakNeural(parts: string[], opts: { voice: NeuralVoiceId; rate: number; volume: number; onEnd?: () => void }): Promise<boolean> {
  if (!neuralSupported || !isNeuralReady(opts.voice) || !parts.length) return false;
  // krótsze fragmenty (zdania) = szybszy start czytania; kolejne zdania syntezujemy w tle
  parts = parts.flatMap((p) => p.split(/(?<=[.!?])\s+/)).map((p) => p.trim()).filter(Boolean);
  const my = ++token;
  audio?.pause();
  try {
    let next = synth(parts[0], opts.voice);
    for (let i = 0; i < parts.length; i++) {
      const url = await next;
      if (my !== token) return true;
      if (i + 1 < parts.length) next = synth(parts[i + 1], opts.voice);
      await play(url, opts.rate, opts.volume, my);
      if (my !== token) return true;
    }
    return true;
  } catch {
    return false;
  } finally {
    if (my === token) opts.onEnd?.();
  }
}

export function stopNeural() {
  token++;
  audio?.pause();
  audio = null;
}

/** Nagranie tekstu jako plik WAV (np. do sprawdzenia głosu lub zapisu próbki). */
export async function synthesizeWav(text: string, voice: NeuralVoiceId): Promise<Blob> {
  return (await getSession(voice)).predict(text);
}

export function neuralSnapshot(): NeuralState {
  return state;
}
