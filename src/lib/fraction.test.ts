import { describe, expect, it } from 'vitest';
import { F, Fraction } from './fraction';
import { checkFractionAnswer, parseAnswer } from './parse';
import { spokenFraction, toSpoken } from './spoken';

describe('Fraction', () => {
  it('liczy i skraca', () => {
    expect(F(1, 4).add(F(1, 3)).same(F(7, 12))).toBe(true);
    expect(F(3, 4).sub(F(1, 4)).same(F(1, 2))).toBe(true);
    expect(F(2, 3).mul(F(3, 4)).same(F(1, 2))).toBe(true);
    expect(F(2, 3).div(F(4, 9)).same(F(3, 2))).toBe(true);
  });
  it('liczby mieszane', () => {
    expect(Fraction.fromMixed(2, 1, 3).same(F(7, 3))).toBe(true);
    expect(F(7, 3).toMarkup(true)).toBe('{2 1/3}');
    expect(F(-7, 3).toMarkup(true)).toBe('{-2 1/3}');
  });
  it('ułamki dziesiętne', () => {
    expect(F(3, 8).toDecimalString()).toBe('0,375');
    expect(F(9, 4).toDecimalString()).toBe('2,25');
    expect(F(1, 3).hasFiniteDecimal()).toBe(false);
    expect(Fraction.fromDecimalString('0,75')!.equals(F(3, 4))).toBe(true);
  });
});

describe('parseAnswer / checkFractionAnswer', () => {
  it('rozpoznaje formy zapisu', () => {
    expect(parseAnswer('3/4')?.form).toBe('fraction');
    expect(parseAnswer(' 1 1/2 ')?.value.equals(F(3, 2))).toBe(true);
    expect(parseAnswer('−2/5')?.value.equals(F(-2, 5))).toBe(true);
    expect(parseAnswer('0,5')?.value.equals(F(1, 2))).toBe(true);
    expect(parseAnswer('3 / 0')).toBeNull();
    expect(parseAnswer('abc')).toBeNull();
  });
  it('wymaga skrócenia', () => {
    expect(checkFractionAnswer('2/4', F(1, 2), { requireSimplest: true }).status).toBe('not-simplified');
    expect(checkFractionAnswer('1/2', F(1, 2), { requireSimplest: true }).status).toBe('correct');
    expect(checkFractionAnswer('1 2/4', F(3, 2), { requireSimplest: true }).status).toBe('not-simplified');
  });
  it('wymaga formy', () => {
    expect(checkFractionAnswer('7/3', F(7, 3), { requireMixed: true }).status).toBe('improper-not-allowed');
    expect(checkFractionAnswer('2 1/3', F(7, 3), { requireImproper: true }).status).toBe('wrong-form');
    expect(checkFractionAnswer('3/4', F(3, 4), { requireDecimal: true }).status).toBe('wrong-form');
    expect(checkFractionAnswer('0.75', F(3, 4), { requireDecimal: true }).status).toBe('correct');
  });
});

describe('odczyt po polsku', () => {
  it('ułamki', () => {
    expect(spokenFraction(1, 2)).toBe('jedna druga');
    expect(spokenFraction(3, 4)).toBe('trzy czwarte');
    expect(spokenFraction(5, 8)).toBe('pięć ósmych');
    expect(spokenFraction(2, 3)).toBe('dwie trzecie');
    expect(spokenFraction(12, 25)).toBe('dwanaście dwudziestych piątych');
    expect(spokenFraction(22, 7)).toBe('dwadzieścia dwie siódme');
    expect(spokenFraction(1, 100)).toBe('jedna setna');
  });
  it('wyrażenia', () => {
    expect(toSpoken('Oblicz: {1 1/2} + {3/4}')).toBe('Oblicz: jeden i jedna druga dodać trzy czwarte');
    expect(toSpoken('{2/3} : {4/9}')).toBe('dwie trzecie podzielić przez cztery dziewiąte');
  });
});
