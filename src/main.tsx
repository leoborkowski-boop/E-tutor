import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Tylko alfabety łaciński i łaciński rozszerzony (polskie znaki) – mniejsza aplikacja.
// Przy wersji ukraińskiej dodać podzbiór cyrylicy (cyrillic-*.css).
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-ext-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-ext-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-ext-600.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource/inter/latin-ext-700.css';
import '@fontsource/opendyslexic/latin-400.css';
import '@fontsource/opendyslexic/latin-700.css';
import App from './App';
import { AppStateProvider } from './state/AppState';
import './styles.css';

// W wersji udostępnianej linkiem szkielet strony nie ustawia języka
document.documentElement.lang = 'pl';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppStateProvider>
      <App />
    </AppStateProvider>
  </StrictMode>,
);
