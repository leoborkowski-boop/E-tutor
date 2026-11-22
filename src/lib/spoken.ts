/**
 * Zamiana tekstu z notacją MathText na tekst do odczytania po polsku,
 * np. "{3/4} + {1 1/2}" → "trzy czwarte dodać jeden i jedna druga".
 */

const UNITS = ['zero', 'jeden', 'dwa', 'trzy', 'cztery', 'pięć', 'sześć', 'siedem', 'osiem', 'dziewięć'];
const TEENS = [
  'dziesięć',
  'jedenaście',
  'dwanaście',
  'trzynaście',
  'czternaście',
  'piętnaście',
  'szesnaście',
  'siedemnaście',
  'osiemnaście',
  'dziewiętnaście',
];
const TENS = ['', '', 'dwadzieścia', 'trzydzieści', 'czterdzieści', 'pięćdziesiąt', 'sześćdziesiąt', 'siedemdziesiąt', 'osiemdziesiąt', 'dziewięćdziesiąt'];
const HUNDREDS = ['', 'sto', 'dwieście', 'trzysta', 'czterysta', 'pięćset', 'sześćset', 'siedemset', 'osiemset', 'dziewięćset'];

function below1000(n: number, feminine: boolean): string[] {
  const words: string[] = [];
  const h = Math.floor(n / 100);
  const rest = n % 100;
  if (h) words.push(HUNDREDS[h]);
  if (rest >= 10 && rest < 20) words.push(TEENS[rest - 10]);
  else {
    const t = Math.floor(rest / 10);
    const u = rest % 10;
    if (t) words.push(TENS[t]);
    if (u) {
      if (feminine && u === 2) words.push('dwie');
      else if (feminine && u === 1 && n === 1) words.push('jedna');
      else words.push(UNITS[u]);
    }
  }
  return words;
}

/** Liczebnik główny. feminine=true daje „jedna”, „dwie” (do liczników ułamków). */
export function cardinal(n: number, feminine = false): string {
  if (!Number.isFinite(n) || !Number.isInteger(n)) return String(n);
  if (n < 0) return 'minus ' + cardinal(-n, feminine);
  if (n === 0) return 'zero';
  if (n >= 1_000_000) return String(n);
  const thousands = Math.floor(n / 1000);
  const rest = n % 1000;
  const words: string[] = [];
  if (thousands) {
    if (thousands === 1) words.push('tysiąc');
    else {
      words.push(...below1000(thousands, false));
      const last = thousands % 10;
      const lastTwo = thousands % 100;
      words.push(last >= 2 && last <= 4 && !(lastTwo >= 12 && lastTwo <= 14) ? 'tysiące' : 'tysięcy');
    }
  }
  if (rest) words.push(...below1000(rest, feminine));
  return words.join(' ');
}

const ORD_UNITS = ['', 'pierwsza', 'druga', 'trzecia', 'czwarta', 'piąta', 'szósta', 'siódma', 'ósma', 'dziewiąta'];
const ORD_TEENS = [
  'dziesiąta',
  'jedenasta',
  'dwunasta',
  'trzynasta',
  'czternasta',
  'piętnasta',
  'szesnasta',
  'siedemnasta',
  'osiemnasta',
  'dziewiętnasta',
];
const ORD_TENS = ['', '', 'dwudziesta', 'trzydziesta', 'czterdziesta', 'pięćdziesiąta', 'sześćdziesiąta', 'siedemdziesiąta', 'osiemdziesiąta', 'dziewięćdziesiąta'];

/** Liczebnik porządkowy rodzaju żeńskiego (mianownik l.poj.) – lista słów. */
function ordinalWords(n: number): string[] | null {
  if (n === 100) return ['setna'];
  if (n === 1000) return ['tysięczna'];
  if (n < 1 || n > 99) return null;
  if (n < 10) return [ORD_UNITS[n]];
  if (n < 20) return [ORD_TEENS[n - 10]];
  const t = Math.floor(n / 10);
  const u = n % 10;
  return u ? [ORD_TENS[t], ORD_UNITS[u]] : [ORD_TENS[t]];
}

function toPluralNom(w: string) {
  return w.replace(/a$/, 'e');
}
function toPluralGen(w: string) {
  if (w.endsWith('ia')) return w.slice(0, -2) + 'ich';
  if (w.endsWith('ga') || w.endsWith('ka')) return w.slice(0, -1) + 'ich';
  return w.slice(0, -1) + 'ych';
}

/** Odczyt ułamka: 1/2 → „jedna druga”, 3/4 → „trzy czwarte”, 5/8 → „pięć ósmych”. */
export function spokenFraction(num: number, den: number): string {
  const neg = num < 0;
  num = Math.abs(num);
  const ord = ordinalWords(den);
  if (!ord) return `${neg ? 'minus ' : ''}${cardinal(num)} przez ${cardinal(den)}`;
  const last = num % 10;
  const lastTwo = num % 100;
  let denWords: string[];
  if (num === 1) denWords = ord;
  else if (last >= 2 && last <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) denWords = ord.map(toPluralNom);
  else denWords = ord.map(toPluralGen);
  return `${neg ? 'minus ' : ''}${cardinal(num, true)} ${denWords.join(' ')}`;
}

const TOKEN = /\{(-?)(?:(\d+) )?([^{}\/\s]+)\/([^{}\/\s]+)\}/g;

function speakExpr(e: string) {
  return e
    .replace(/\d+/g, (d) => ` ${cardinal(Number(d))} `)
    .replace(/·/g, ' razy ')
    .replace(/:/g, ' podzielić przez ')
    .replace(/\+/g, ' dodać ')
    .replace(/[−-]/g, ' odjąć ')
    .replace(/[?□]/g, ' ile ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function toSpoken(text: string): string {
  let s = text.replace(TOKEN, (_m, sign: string, whole: string | undefined, n: string, d: string) => {
    const numeric = /^\d+$/.test(n) && /^\d+$/.test(d);
    const minus = sign ? 'minus ' : '';
    if (!numeric) {
      return `${minus}${whole ? cardinal(Number(whole)) + ' i ' : ''}${speakExpr(n)} przez ${speakExpr(d)}`;
    }
    const frac = spokenFraction(Number(n), Number(d));
    return whole ? `${minus}${cardinal(Number(whole))} i ${frac}` : `${minus}${frac}`;
  });
  s = s
    .replace(/\*\*/g, '')
    .replace(/cm²/g, ' centymetrów kwadratowych')
    .replace(/dm²/g, ' decymetrów kwadratowych')
    .replace(/km²/g, ' kilometrów kwadratowych')
    .replace(/cm³/g, ' centymetrów sześciennych')
    .replace(/dm³/g, ' decymetrów sześciennych')
    .replace(/m³/g, ' metrów sześciennych')
    .replace(/m\/s/g, ' metrów na sekundę')
    .replace(/∛/g, ' pierwiastek sześcienny z ')
    .replace(/√/g, ' pierwiastek z ')
    .replace(/°/g, ' stopni')
    .replace(/%/g, ' procent')
    .replace(/p\.p\./g, ' punktów procentowych')
    // wykładniki zapisane indeksem górnym (oprócz ² i ³)
    .replace(/([⁰¹⁴⁵⁶⁷⁸⁹⁻][⁰¹²³⁴⁵⁶⁷⁸⁹]*|[²³][⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, (m) => ' do potęgi ' + m.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]/g, (c) => String('⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c) >= 0 ? '⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c) : '-')) + ' ')
    .replace(/m²/g, ' metrów kwadratowych')
    .replace(/²/g, ' do kwadratu')
    .replace(/³/g, ' do sześcianu')
    .replace(/\s·\s/g, ' razy ')
    .replace(/\s:\s/g, ' podzielić przez ')
    .replace(/\s\+\s/g, ' dodać ')
    .replace(/\s[−-]\s/g, ' odjąć ')
    .replace(/\s=\s/g, ' równa się ')
    .replace(/\s≈\s/g, ' w przybliżeniu ')
    .replace(/\s<\s/g, ' jest mniejsze od ')
    .replace(/\s>\s/g, ' jest większe od ')
    .replace(/□/g, ' ile ')
    .replace(/[()]/g, ' ')
    .replace(/km\/h/g, 'kilometrów na godzinę')
    .replace(/\s+/g, ' ');
  return s.trim();
}
