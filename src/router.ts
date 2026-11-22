import { useEffect, useState } from 'react';

export type Route =
  | { name: 'home' }
  | { name: 'material' }
  | { name: 'topic'; id: string }
  | { name: 'practice'; id: string }
  | { name: 'exam' }
  | { name: 'diagnostic' }
  | { name: 'progress' }
  | { name: 'settings' }
  | { name: 'lessons' }
  | { name: 'zone'; id: string }
  | { name: 'lesson'; id: string }
  | { name: 'ai' }
  | { name: 'ailesson'; id: string };

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
    case 'lekcje':
      return { name: 'lessons' };
    case 'dzial':
      return parts[1] ? { name: 'zone', id: parts[1] } : { name: 'lessons' };
    case 'lekcja':
      return parts[1] ? { name: 'lesson', id: decodeURIComponent(parts[1]) } : { name: 'lessons' };
    case 'moje-lekcje':
      return { name: 'ai' };
    case 'moja-lekcja':
      return parts[1] ? { name: 'ailesson', id: parts[1] } : { name: 'ai' };
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
  lessons: '#/lekcje',
  zone: (id: string) => `#/dzial/${id}`,
  lesson: (id: string) => `#/lekcja/${encodeURIComponent(id)}`,
  ai: '#/moje-lekcje',
  aiLesson: (id: string) => `#/moja-lekcja/${id}`,
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
