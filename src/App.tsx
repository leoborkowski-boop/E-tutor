import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core';
import { Suspense, lazy, useEffect, useRef } from 'react';
import { Icon } from './components/ui';
import { LogoMark, LogoName } from './brand/Logo';
import { href, useRoute, type Route } from './router';
import { TOPIC_BY_ID } from './content/topics';
import type { TopicId } from './content/types';
import { Home } from './screens/Home';
import { Material } from './screens/Material';
import { Practice } from './screens/Practice';
import { Theory } from './screens/Theory';

// Rzadziej używane ekrany ładujemy dopiero przy pierwszym wejściu (mniejszy start aplikacji)
const Exam = lazy(() => import('./screens/Exam').then((m) => ({ default: m.Exam })));
const Diagnostic = lazy(() => import('./screens/Diagnostic').then((m) => ({ default: m.Diagnostic })));
const ProgressScreen = lazy(() => import('./screens/ProgressScreen').then((m) => ({ default: m.ProgressScreen })));
const SettingsScreen = lazy(() => import('./screens/SettingsScreen').then((m) => ({ default: m.SettingsScreen })));

function screenTitle(route: Route) {
  switch (route.name) {
    case 'home':
      return 'Start';
    case 'material':
      return 'Materiał';
    case 'topic':
      return TOPIC_BY_ID[route.id as TopicId]?.title ?? 'Teoria';
    case 'practice':
      return `Ćwiczenia: ${TOPIC_BY_ID[route.id as TopicId]?.title ?? (route.id === 'powtorka' ? 'powtórka' : 'mieszane')}`;
    case 'exam':
      return 'Próbny arkusz';
    case 'diagnostic':
      return 'Test diagnostyczny';
    case 'progress':
      return 'Postępy';
    case 'settings':
      return 'Ustawienia';
  }
}

/** Po zmianie ekranu: tytuł karty i fokus na nagłówku (czytnik ekranu ogłasza nowy widok). */
function useRouteAnnouncement(route: Route) {
  const first = useRef(true);
  const key = JSON.stringify(route);
  useEffect(() => {
    document.title = `${screenTitle(route)} · EduKwadrat`;
    if (first.current) {
      first.current = false;
      return;
    }
    const id = window.setTimeout(() => {
      const h1 = document.querySelector<HTMLElement>('main h1');
      if (h1) {
        h1.tabIndex = -1;
        h1.focus({ preventScroll: true });
      }
    }, 60);
    return () => window.clearTimeout(id);
  }, [key]);
}
import { useApp } from './state/AppState';

const NAV: { name: Route['name'][]; label: string; icon: string; to: string }[] = [
  { name: ['home'], label: 'Start', icon: 'home', to: href.home },
  { name: ['material', 'topic', 'practice'], label: 'Materiał', icon: 'book', to: href.material },
  { name: ['exam', 'diagnostic'], label: 'Egzamin', icon: 'exam', to: href.exam },
  { name: ['progress'], label: 'Postępy', icon: 'chart', to: href.progress },
  { name: ['settings'], label: 'Ustawienia', icon: 'settings', to: href.settings },
];

function useAppearance() {
  const { settings } = useApp();
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', settings.theme);
    root.toggleAttribute('data-contrast', settings.highContrast);
    root.toggleAttribute('data-dyslexia', settings.dyslexiaFont);
    root.toggleAttribute('data-spacing', settings.wideSpacing);
    root.toggleAttribute('data-reduce-motion', settings.reduceMotion);
    root.style.setProperty('--font-scale', String(settings.fontScale));
    // W aplikacji Android: kolor ikon paska stanu zgodny z motywem aplikacji
    if (Capacitor.isNativePlatform()) {
      const dark = settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      void SystemBars.setStyle({ style: dark ? SystemBarsStyle.Dark : SystemBarsStyle.Light }).catch(() => {});
    }
  }, [settings.theme, settings.highContrast, settings.dyslexiaFont, settings.wideSpacing, settings.reduceMotion, settings.fontScale]);
}

function Toasts() {
  const { toasts, dismissToast } = useApp();
  const firstId = toasts[0]?.id;
  useEffect(() => {
    if (!firstId) return;
    const t = window.setTimeout(() => dismissToast(firstId), 5000);
    return () => window.clearTimeout(t);
  }, [firstId, dismissToast]);
  if (!toasts.length) return null;
  const b = toasts[0];
  return (
    <div className="toast" role="status">
      <span className="badge-icon" aria-hidden="true">{b.icon}</span>
      <div>
        <strong>Nowa odznaka: {b.name}</strong>
        <span className="muted small">{b.description}</span>
      </div>
      <button type="button" className="toast-close" aria-label="Zamknij powiadomienie o odznace" onClick={() => dismissToast(b.id)}>
        <Icon name="x" size={16} />
      </button>
    </div>
  );
}

function Screen({ route }: { route: Route }) {
  switch (route.name) {
    case 'home':
      return <Home />;
    case 'material':
      return <Material />;
    case 'topic':
      return <Theory key={route.id} id={route.id} />;
    case 'practice':
      return <Practice key={route.id} id={route.id} />;
    case 'exam':
      return <Exam />;
    case 'diagnostic':
      return <Diagnostic />;
    case 'progress':
      return <ProgressScreen />;
    case 'settings':
      return <SettingsScreen />;
  }
}

export default function App() {
  const route = useRoute();
  useAppearance();
  useRouteAnnouncement(route);
  return (
    <div className="app">
      <a className="skip-link" href="#main" onClick={(e) => {
        e.preventDefault();
        document.getElementById('main')?.focus();
      }}>
        Przejdź do treści
      </a>
      <header className="topbar">
        <a className="brand" href={href.home}>
          <LogoMark size={34} />
          <LogoName height={19} />
          <span className="sr-only">EduKwadrat – strona główna</span>
        </a>
        <nav className="nav" aria-label="Główna nawigacja">
          {NAV.map((n) => (
            <a key={n.label} href={n.to} className={`nav-item ${n.name.includes(route.name) ? 'is-active' : ''}`} aria-current={n.name.includes(route.name) ? 'page' : undefined}>
              <Icon name={n.icon} size={20} />
              <span>{n.label}</span>
            </a>
          ))}
        </nav>
      </header>
      <main className="main" id="main" tabIndex={-1}>
        <Suspense fallback={<p className="muted">Ładowanie…</p>}>
          <Screen route={route} />
        </Suspense>
      </main>
      <Toasts />
    </div>
  );
}
