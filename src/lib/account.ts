/**
 * Konto użytkownika: komunikacja z serwerem kont (katalog deploy/api, na home.pl).
 *
 * Sesja to losowy token zapisany na urządzeniu (nie ciasteczko), wysyłany w nagłówku X-Edu-Token.
 * Dzięki temu to samo działa w przeglądarce i w aplikacji na Androidzie.
 */
import { Capacitor } from '@capacitor/core';
import { load, save, remove } from '../state/storage';

const SITE = 'https://edukwadrat.pl';

/** Adres API: zmienna VITE_API_URL, w aplikacji na Androidzie adres strony, w przeglądarce katalog ../api obok aplikacji. */
export const API_URL: string = (() => {
  const env = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  if (env) return env;
  if (import.meta.env.MODE === 'artifact') return '';
  if (Capacitor.isNativePlatform()) return `${SITE}/api/index.php`;
  if (import.meta.env.PROD && /^https?:$/.test(window.location.protocol)) return new URL('../api/index.php', window.location.href).href;
  return '';
})();

/** Adres podstrony serwisu (regulamin, polityka prywatności): względny w przeglądarce, pełny w aplikacji na Androidzie. */
export function siteUrl(path: string): string {
  if (Capacitor.isNativePlatform() || !/^https?:$/.test(window.location.protocol)) return `${SITE}/${path}`;
  return new URL(`../${path}`, window.location.href).href;
}

export type Access = { produkt: string; do: number };
export type Session = { token: string; email: string; verified: boolean; access: Access[] };

type Ok<T> = { ok: true } & T;
type Fail = { ok: false; blad: string; status: number; offline?: boolean; wylogowano?: boolean; konflikt?: boolean; niedostepne?: boolean; wersja?: number; dane?: unknown };
export type Result<T = object> = Ok<T> | Fail;

const TIMEOUT_MS = 25_000;

async function call<T = object>(action: string, opts: { body?: unknown; token?: string; method?: 'GET' | 'POST' } = {}): Promise<Result<T>> {
  if (!API_URL) return { ok: false, blad: 'Konta nie są dostępne w tej wersji aplikacji.', status: 0, niedostepne: true };
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const headers: Record<string, string> = {};
    if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
    if (opts.token) headers['X-Edu-Token'] = opts.token;
    const res = await fetch(`${API_URL}${API_URL.includes('?') ? '&' : '?'}a=${action}`, {
      method: opts.method ?? (opts.body !== undefined ? 'POST' : 'GET'),
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: ctrl.signal,
      cache: 'no-store',
    });
    let data: Record<string, unknown> = {};
    try {
      data = (await res.json()) as Record<string, unknown>;
    } catch {
      /* odpowiedź bez JSON (np. błąd serwera) */
    }
    if (res.ok && data.ok) return data as Ok<T>;
    return {
      ok: false,
      status: res.status,
      blad: typeof data.blad === 'string' ? data.blad : 'Serwer nie odpowiada poprawnie. Spróbuj ponownie za chwilę.',
      wylogowano: data.wylogowano === true,
      konflikt: data.konflikt === true,
      niedostepne: data.niedostepne === true,
      wersja: typeof data.wersja === 'number' ? data.wersja : undefined,
      dane: data.dane,
    };
  } catch {
    return { ok: false, status: 0, offline: true, blad: 'Brak połączenia z serwerem. Sprawdź internet i spróbuj ponownie.' };
  } finally {
    window.clearTimeout(timer);
  }
}

/* ---------- sesja zapisana na urządzeniu ---------- */

export function loadSession(): Session | null {
  const s = load<Session | null>('account', null);
  return s && typeof s.token === 'string' && s.token.length === 64 && typeof s.email === 'string' ? { ...s, access: s.access ?? [] } : null;
}
export function saveSession(s: Session) {
  save('account', s);
}
export function clearSession() {
  remove('account');
}
/** E-mail konta, z którym ostatnio synchronizowano postępy na tym urządzeniu. */
export const loadSyncedFor = () => load<string | null>('accountSyncedFor', null);
export const saveSyncedFor = (email: string) => save('accountSyncedFor', email);

/* ---------- wywołania API ---------- */

type Me = { email: string; zweryfikowany: boolean; dostep: Access[] };

export const apiRegister = (email: string, haslo: string, zgoda: boolean) => call<{ wiadomosc: string }>('rejestracja', { body: { email, haslo, zgoda } });
export const apiLogin = (email: string, haslo: string) =>
  call<Me & { token: string }>('logowanie', { body: { email, haslo, urzadzenie: Capacitor.isNativePlatform() ? 'Android' : 'Przeglądarka' } });
export const apiLogout = (token: string) => call('wyloguj', { body: {}, token });
export const apiMe = (token: string) => call<Me>('ja', { token, method: 'GET' });
export const apiResend = (token: string) => call<{ wiadomosc: string }>('ponow', { body: {}, token });
export const apiForgot = (email: string) => call<{ wiadomosc: string }>('zapomnialem', { body: { email } });
export const apiChangePassword = (token: string, stare: string, nowe: string) => call('zmien_haslo', { body: { stare, nowe }, token });
export const apiDelete = (token: string, haslo: string) => call('usun', { body: { haslo }, token });
export const apiPull = (token: string) => call<{ wersja: number; dane: unknown }>('postepy', { token, method: 'GET' });
export const apiPush = (token: string, dane: unknown, wersja: number) =>
  call<{ wersja: number; dane?: unknown }>('postepy', { body: { dane, wersja }, token });
