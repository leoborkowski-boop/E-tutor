import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core';
import { useEffect } from 'react';
import { Icon } from './components/ui';
import { href, useRoute, type Route } from './router';
import { Diagnostic } from './screens/Diagnostic';
import { Exam } from './screens/Exam';
import { Home } from './screens/Home';
import { Material } from './screens/Material';
import { Practice } from './screens/Practice';
import { ProgressScreen } from './screens/ProgressScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { Theory } from './screens/Theory';
import { LessonScreen, ZoneScreen, ZonesScreen } from './screens/Lessons';
import { AiLessonScreen, AiLessonsScreen } from './screens/AiLessons';
import { useApp } from './state/AppState';

const NAV: { name: Route['name'][]; label: string; icon: string; to: string }[] = [
  { name: ['home'], label: 'Start', icon: 'home', to: href.home },
  { name: ['lessons', 'zone', 'lesson', 'ai', 'ailesson', 'material', 'topic', 'practice'], label: 'Lekcje', icon: 'book', to: href.lessons },
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
      <button type="button" className="toast-close" aria-label="Zamknij" onClick={() => dismissToast(b.id)}>
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
    case 'lessons':
      return <ZonesScreen />;
    case 'zone':
      return <ZoneScreen key={route.id} id={route.id} />;
    case 'lesson':
      return <LessonScreen key={route.id} id={route.id} />;
    case 'ai':
      return <AiLessonsScreen />;
    case 'ailesson':
      return <AiLessonScreen key={route.id} id={route.id} />;
  }
}

export default function App() {
  const route = useRoute();
  useAppearance();
  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href={href.home}>
          <span className="brand-mark">½</span>
          <span className="brand-name">E-tutor</span>
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
      <main className="main">
        <Screen route={route} />
      </main>
      <Toasts />
    </div>
  );
}
