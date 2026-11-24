/**
 * Stan konta i synchronizacja postępów z serwerem.
 *
 * Aplikacja działa bez konta. Po zalogowaniu postępy są co najmniej raz na minutę
 * scalane z kontem (pobierz → scal z lokalnymi → zapisz), więc uczeń ma je na każdym urządzeniu.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  API_URL,
  apiChangePassword,
  apiDelete,
  apiForgot,
  apiLogin,
  apiLogout,
  apiMe,
  apiPull,
  apiPush,
  apiRegister,
  apiResend,
  clearSession,
  loadSession,
  loadSyncedFor,
  saveSession,
  saveSyncedFor,
  type Result,
  type Session,
} from '../lib/account';
import { canonicalJson, mergeProgress, normalizeProgress } from './merge';
import { useApp } from './AppState';

export type SyncState = 'idle' | 'syncing' | 'error';

type AccountApi = {
  /** Czy ta wersja aplikacji ma adres serwera kont. */
  available: boolean;
  session: Session | null;
  sync: SyncState;
  lastSync: number | null;
  /** Komunikat o ostatnim problemie z synchronizacją (np. brak internetu). */
  syncMessage: string | null;
  /** Komunikat po wygaśnięciu sesji. */
  notice: string | null;
  register: (email: string, password: string, consent: boolean) => Promise<Result<{ wiadomosc: string }>>;
  login: (email: string, password: string) => Promise<Result>;
  logout: (wipeLocal: boolean) => Promise<void>;
  forgot: (email: string) => Promise<Result<{ wiadomosc: string }>>;
  resend: () => Promise<Result<{ wiadomosc: string }>>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<Result>;
  deleteAccount: (password: string) => Promise<Result>;
  syncNow: () => Promise<void>;
};

const Ctx = createContext<AccountApi | null>(null);

const MIN_INTERVAL_MS = 60_000; // serwer przyjmuje ok. 120 zapisów na godzinę – synchronizujemy najwyżej raz na minutę
const DEBOUNCE_MS = 6_000;

export function AccountProvider({ children }: { children: ReactNode }) {
  const { progress, applyRemote, resetProgress } = useApp();
  const [session, setSessionState] = useState<Session | null>(() => (API_URL ? loadSession() : null));
  const [sync, setSync] = useState<SyncState>('idle');
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const progressRef = useRef(progress);
  progressRef.current = progress;
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const busy = useRef(false);
  const again = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  const lastStart = useRef(0);
  const scheduleRef = useRef<(now?: boolean) => void>(() => {});

  const setSession = useCallback((s: Session | null) => {
    sessionRef.current = s;
    setSessionState(s);
    if (s) saveSession(s);
    else clearSession();
  }, []);

  const expire = useCallback(() => {
    setSession(null);
    setSync('idle');
    setNotice('Sesja wygasła. Zaloguj się ponownie – postępy na tym urządzeniu zostały.');
  }, [setSession]);

  /** Jeden obieg synchronizacji: pobierz z konta, scal z lokalnymi, zapisz, jeśli coś się zmieniło. */
  const runSync = useCallback(async () => {
    const s0 = sessionRef.current;
    if (!s0 || !API_URL) return;
    if (busy.current) {
      again.current = true;
      return;
    }
    busy.current = true;
    lastStart.current = Date.now();
    setSync('syncing');
    try {
      // odświeżamy dane konta (np. czy adres e-mail został już potwierdzony)
      const me = await apiMe(s0.token);
      if (me.ok) setSession({ ...s0, verified: me.zweryfikowany, access: me.dostep });
      else if (me.wylogowano) return expire();
      const token = s0.token;
      let zapisane = false;
      for (let proba = 0; proba < 3 && !zapisane; proba++) {
        const srv = await apiPull(token);
        if (!srv.ok) {
          if (srv.wylogowano) return expire();
          throw new Error(srv.blad);
        }
        const remote = srv.dane ? normalizeProgress(srv.dane) : null;
        const local = progressRef.current;
        const merged = remote ? mergeProgress(local, remote) : local;
        if (remote && canonicalJson(merged) !== canonicalJson(local)) applyRemote(remote);
        if (remote && canonicalJson(merged) === canonicalJson(remote)) {
          zapisane = true; // serwer ma już wszystko, co mamy
          break;
        }
        const push = await apiPush(token, normalizeProgress(merged), srv.wersja);
        if (push.ok) {
          zapisane = true;
          break;
        }
        if (push.wylogowano) return expire();
        if (push.konflikt) continue; // ktoś zapisał w międzyczasie – pobieramy jeszcze raz i scalamy
        throw new Error(push.blad);
      }
      if (!zapisane) throw new Error('Postępy zmieniają się na kilku urządzeniach naraz. Spróbujemy za chwilę.');
      saveSyncedFor(s0.email);
      setLastSync(Date.now());
      setSyncMessage(null);
      setSync('idle');
    } catch (e) {
      setSync('error');
      setSyncMessage(e instanceof Error && e.message ? e.message : 'Synchronizacja nie udała się. Spróbujemy ponownie.');
    } finally {
      busy.current = false;
      if (again.current) {
        again.current = false;
        scheduleRef.current(true);
      }
    }
  }, [applyRemote, expire, setSession]);

  const schedule = useCallback(
    (now = false) => {
      window.clearTimeout(timer.current);
      if (!sessionRef.current) return;
      const wait = now ? 0 : Math.max(DEBOUNCE_MS, lastStart.current + MIN_INTERVAL_MS - Date.now());
      timer.current = window.setTimeout(() => void runSync(), wait);
    },
    [runSync],
  );
  scheduleRef.current = schedule;

  // zmiana postępów → synchronizacja po chwili ciszy (ale nie częściej niż raz na minutę)
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (session) schedule();
  }, [progress, session, schedule]);

  // zalogowany użytkownik: synchronizacja przy starcie i po powrocie do aplikacji
  const email = session?.email;
  useEffect(() => {
    if (!email) return;
    schedule(true);
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastStart.current > MIN_INTERVAL_MS) schedule(true);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.clearTimeout(timer.current);
    };
  }, [email, schedule]);

  const value = useMemo<AccountApi>(
    () => ({
      available: Boolean(API_URL),
      session,
      sync,
      lastSync,
      syncMessage,
      notice,
      register: (e, p, c) => apiRegister(e.trim(), p, c),
      login: async (e, p) => {
        const r = await apiLogin(e.trim(), p);
        if (!r.ok) return r;
        // postępy na urządzeniu należą do innego konta – nie mieszamy ich z tym kontem
        const prev = loadSyncedFor();
        if (prev && prev !== r.email) resetProgress();
        setNotice(null);
        setSession({ token: r.token, email: r.email, verified: r.zweryfikowany, access: r.dostep ?? [] });
        return { ok: true };
      },
      logout: async (wipeLocal) => {
        const s = sessionRef.current;
        if (s) {
          // ostatnia synchronizacja przed wylogowaniem, żeby nic nie przepadło (najwyżej 6 sekund)
          window.clearTimeout(timer.current);
          await Promise.race([runSync(), new Promise((r) => window.setTimeout(r, 6000))]);
          void apiLogout(s.token);
        }
        setSession(null);
        setSync('idle');
        setNotice(null);
        if (wipeLocal) {
          resetProgress();
          clearSyncedFor();
        }
      },
      forgot: (e) => apiForgot(e.trim()),
      resend: async () => {
        const s = sessionRef.current;
        return s ? apiResend(s.token) : { ok: false, blad: 'Nie jesteś zalogowany.', status: 401 };
      },
      changePassword: async (o, n) => {
        const s = sessionRef.current;
        if (!s) return { ok: false, blad: 'Nie jesteś zalogowany.', status: 401 };
        return apiChangePassword(s.token, o, n);
      },
      deleteAccount: async (p) => {
        const s = sessionRef.current;
        if (!s) return { ok: false, blad: 'Nie jesteś zalogowany.', status: 401 };
        const r = await apiDelete(s.token, p);
        if (r.ok) {
          window.clearTimeout(timer.current);
          setSession(null);
          clearSyncedFor();
        }
        return r;
      },
      syncNow: async () => {
        window.clearTimeout(timer.current);
        await runSync();
      },
    }),
    [session, sync, lastSync, syncMessage, notice, resetProgress, runSync, setSession],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function clearSyncedFor() {
  try {
    saveSyncedFor('');
  } catch {
    /* ignorujemy */
  }
}

export function useAccount() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAccount poza AccountProvider');
  return v;
}

