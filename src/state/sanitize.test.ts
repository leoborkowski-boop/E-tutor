import { describe, expect, it } from 'vitest';
import { sanitizeProgress, sanitizeSettings } from './sanitize';
import { DEFAULT_SETTINGS } from './settings';

describe('walidacja zapisanych danych', () => {
  it('odrzuca śmieci zamiast się wysypać', () => {
    for (const bad of [null, 42, 'x', [], { attempts: 'nie' }, { attempts: [{}, null, 5] }, { badges: [1, 2] }]) {
      const p = sanitizeProgress(bad);
      expect(p.attempts).toEqual([]);
      expect(p.diagnosticDone).toBe(false);
    }
  });
  it('zachowuje poprawne próby i odrzuca nieznane działy', () => {
    const ok = { ts: 1, topicId: 'dodawanie', difficulty: 2, correct: true, score: 1, hints: 0, source: 'practice' };
    const p = sanitizeProgress({ attempts: [ok, { ...ok, topicId: 'hakowanie' }, { ...ok, score: 7 }], diagnosticDone: true });
    expect(p.attempts).toHaveLength(1);
    expect(p.diagnosticDone).toBe(true);
  });
  it('nie przenosi __proto__ z pliku', () => {
    const p = sanitizeProgress(JSON.parse('{"badges":{"__proto__":{"x":1},"first-step":5}}'));
    expect(Object.keys(p.badges)).toEqual(['first-step']);
    expect(({} as Record<string, unknown>).x).toBeUndefined();
  });
  it('ustawienia spoza zakresu wracają do domyślnych', () => {
    const s = sanitizeSettings({ theme: 'neon', fontScale: 99, sessionLength: 15, sounds: 'tak', voiceURI: null });
    expect(s.theme).toBe(DEFAULT_SETTINGS.theme);
    expect(s.fontScale).toBe(DEFAULT_SETTINGS.fontScale);
    expect(s.sessionLength).toBe(15);
    expect(s.sounds).toBe(DEFAULT_SETTINGS.sounds);
  });
});
