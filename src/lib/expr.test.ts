import { describe, expect, it } from 'vitest';
import { evaluate } from './expr';
import { toSpoken } from './spoken';
import { toLesson, type AiLessonRaw } from './ai';

describe('kalkulator wyrażeń (sprawdzanie zadań z AI)', () => {
  it('liczy dokładnie na ułamkach', () => {
    expect(evaluate('3/4 * 120')?.toPlain()).toBe('90');
    expect(evaluate('(2,5 + 1.5) : 2')?.toPlain()).toBe('2');
    expect(evaluate('1/3 + 1/6')?.toPlain()).toBe('1/2');
    expect(evaluate('-2^2')?.toPlain()).toBe('-4');
    expect(evaluate('(-2)^3')?.toPlain()).toBe('-8');
    expect(evaluate('√(144) + √49')?.toPlain()).toBe('19');
    expect(evaluate('120 · 1,23')?.toDecimalString()).toBe('147,6');
  });
  it('odrzuca wyrażenia niepoprawne lub niewymierne', () => {
    expect(evaluate('2 +')).toBeNull();
    expect(evaluate('√2')).toBeNull();
    expect(evaluate('5 / 0')).toBeNull();
    expect(evaluate('alert(1)')).toBeNull();
  });
});

describe('czytanie na głos', () => {
  it('czyta potęgi, pierwiastki i jednostki po polsku', () => {
    expect(toSpoken('2⁵')).toContain('do potęgi 5');
    expect(toSpoken('√49')).toContain('pierwiastek z');
    expect(toSpoken('12 cm²')).toContain('centymetrów kwadratowych');
    expect(toSpoken('25%')).toContain('procent');
  });
});

describe('lekcja z AI', () => {
  const raw: AiLessonRaw = {
    tytul: 'Procenty',
    wstep: 'Wstęp',
    teoria: [{ tytul: 'Reguła', tresc: 'p% = p/100' }],
    przyklady: [{ zadanie: '10% z 50', kroki: ['0,1 · 50'], odpowiedz: '5' }],
    zadania: [
      { tresc: '20% z 80', rodzaj: 'wpisz', odpowiedz: '16', sprawdzenie: '0,2 * 80', jednostka: '', odpowiedzi_do_wyboru: [], podpowiedzi: ['0,2 · 80'], rozwiazanie: ['16'] },
      { tresc: 'Błędne', rodzaj: 'wpisz', odpowiedz: '17', sprawdzenie: '0,2 * 80', jednostka: '', odpowiedzi_do_wyboru: [], podpowiedzi: [], rozwiazanie: [] },
      { tresc: '50% z 30', rodzaj: 'wybierz', odpowiedz: '15', sprawdzenie: '30/2', jednostka: '', odpowiedzi_do_wyboru: ['15', '30', '60', '5'], podpowiedzi: [], rozwiazanie: ['15'] },
      { tresc: 'Cena 40 zł po podwyżce o 10%', rodzaj: 'wpisz', odpowiedz: '44 zł', sprawdzenie: '40 * 1,1', jednostka: 'zł', odpowiedzi_do_wyboru: [], podpowiedzi: [], rozwiazanie: [] },
    ],
  };
  it('przepuszcza tylko zadania ze sprawdzonym wynikiem', () => {
    const l = toLesson(raw, { topic: 'procenty', level: 'sredni' });
    expect(l.tasks).toHaveLength(3);
    expect(l.rejected).toBe(1);
    expect(l.tasks[1].format).toBe('choice');
  });
});
