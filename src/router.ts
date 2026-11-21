import { useEffect, useState } from 'react';

export type Route =
  | { name: 'home' }
  | { name: 'material' }
  | { name: 'topic'; id: string }
  | { name: 'practice'; id: string }
  | { name: 'exam' }
  | { name: 'diagnostic' }
  | { name: 'progress' }
  | { name: 'settings' };

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  switch (parts[0]) {
    case 'material':
      return { name: 'material' };
    case 'temat':
      return parts[1] ? { name: 'topic', id: parts[1] } : { name: 'material' };
    case 'cwicz':
      return { name: 'practice', id: parts[1] ?? 'mix' };
    case 'egzamin':
      return { name: 'exam' };
    case 'diagnoza':
      return { name: 'diagnostic' };
    case 'postepy':
      return { name: 'progress' };
    case 'ustawienia':
      return { name: 'settings' };
    default:
      return { name: 'home' };
  }
}

export const href = {
  home: '#/',
  material: '#/material',
  topic: (id: string) => `#/temat/${id}`,
  practice: (id: string) => `#/cwicz/${id}`,
  exam: '#/egzamin',
  diagnostic: '#/diagnoza',
  progress: '#/postepy',
  settings: '#/ustawienia',
};

export function navigate(to: string) {
  window.location.hash = to;
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const on = () => {
      setRoute(parseHash(window.location.hash));
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}
