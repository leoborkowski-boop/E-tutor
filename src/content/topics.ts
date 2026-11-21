import type { Topic, TopicId } from './types';

/**
 * Materiał teoretyczny – ułamki, klasa 8 (powtórka przed egzaminem ósmoklasisty).
 * Notacja: {a/b} – ułamek, {w a/b} – liczba mieszana, **tekst** – pogrubienie.
 */
export const TOPICS: Topic[] = [
  {
    id: 'pojecie',
    order: 1,
    title: 'Czym jest ułamek',
    short: 'Licznik, mianownik, ułamek na osi liczbowej',
    goals: [
      'Wiem, co oznacza licznik i mianownik.',
      'Potrafię zapisać ułamkiem zamalowaną część figury.',
      'Umiem odczytać i zaznaczyć ułamek na osi liczbowej.',
      'Rozumiem, że kreska ułamkowa oznacza dzielenie.',
    ],
    sections: [
      {
        title: 'Licznik i mianownik',
        blocks: [
          {
            type: 'p',
            text: 'Ułamek opisuje część całości. Gdy całość dzielimy na **równe** części, mianownik mówi, na ile części podzielono całość, a licznik – ile takich części bierzemy.',
          },
          { type: 'rule', title: 'Zapamiętaj', text: '{licznik/mianownik} – mianownik (na dole) mówi „na ile części”, licznik (na górze) mówi „ile części”.' },
          { type: 'visual', visual: { kind: 'bar', num: 3, den: 5 }, caption: 'Pasek podzielono na 5 równych części, zamalowano 3. Zamalowana część to {3/5}.' },
          { type: 'interactive', widget: 'builder', text: 'Zmieniaj licznik i mianownik przyciskami albo dotykaj pasek i oś. Zobacz, jak zmienia się ułamek.' },
          {
            type: 'p',
            text: 'Ułamek, w którym licznik jest mniejszy od mianownika (np. {3/5}), nazywamy **właściwym** – jest mniejszy od 1. Gdy licznik jest równy mianownikowi lub większy (np. {7/5}), mówimy o ułamku **niewłaściwym**.',
          },
        ],
      },
      {
        title: 'Kreska ułamkowa to dzielenie',
        blocks: [
          { type: 'rule', text: '{a/b} = a : b. Na przykład {3/4} = 3 : 4 = 0,75, a {12/4} = 12 : 4 = 3.' },
          {
            type: 'p',
            text: 'Dlatego każdą liczbę naturalną można zapisać jako ułamek: 5 = {5/1} = {10/2} = {15/3}. Mianownik nigdy nie może być zerem – przez zero się nie dzieli.',
          },
        ],
      },
      {
        title: 'Ułamek na osi liczbowej',
        blocks: [
          {
            type: 'p',
            text: 'Aby zaznaczyć ułamek o mianowniku b, dzielimy odcinek od 0 do 1 na b równych części. Każda część to {1/b}. Liczymy **odcinki** od zera – nie kreski.',
          },
          {
            type: 'visual',
            visual: { kind: 'numberline', min: 0, max: 2, den: 4, points: [{ at: 3, label: 'A', showValue: true }, { at: 6, label: 'B', showValue: true }] },
            caption: 'Jednostkę podzielono na 4 części. A = {3/4}, B = {6/4} = {1 1/2}.',
          },
          {
            type: 'example',
            title: 'Przykład',
            problem: 'Jaką część godziny stanowi 20 minut?',
            steps: ['Godzina ma 60 minut – to całość.', 'Część to 20 minut, więc ułamek to {20/60}.', 'Skracamy przez 20: {20/60} = {1/3}.'],
            answer: '20 minut to {1/3} godziny.',
          },
        ],
      },
      {
        title: 'Typowe błędy',
        blocks: [
          {
            type: 'mistake',
            wrong: 'Na osi podzielonej na 4 części punkt na trzeciej kresce za zerem to {3/5}.',
            right: 'To {3/4} – liczymy odcinki, a jednostkę podzielono na 4 odcinki.',
            why: 'Kresek jest zawsze o jedną więcej niż odcinków, bo liczymy też kreskę przy zerze.',
          },
        ],
      },
    ],
  },
  {
    id: 'skracanie',
    order: 2,
    title: 'Skracanie i rozszerzanie',
    short: 'Ułamki równe, postać nieskracalna',
    goals: ['Umiem skrócić ułamek do postaci nieskracalnej.', 'Umiem rozszerzyć ułamek do podanego mianownika.', 'Rozpoznaję ułamki o tej samej wartości.'],
    sections: [
      {
        title: 'Rozszerzanie ułamka',
        blocks: [
          { type: 'rule', title: 'Reguła', text: 'Rozszerzyć ułamek to **pomnożyć** licznik i mianownik przez tę samą liczbę (różną od zera). Wartość ułamka się nie zmienia.' },
          { type: 'visual', visual: { kind: 'bars', items: [{ num: 1, den: 2, label: '{1/2}' }, { num: 2, den: 4, label: '{2/4}' }, { num: 4, den: 8, label: '{4/8}' }] }, caption: 'Te same zamalowane długości – to równe ułamki.' },
          { type: 'interactive', widget: 'equivalent' },
          {
            type: 'example',
            problem: 'Rozszerz {3/5} do mianownika 20.',
            steps: ['20 : 5 = 4, więc mnożymy przez 4.', '{3/5} = {3·4/5·4} = {12/20}.'],
            answer: '{3/5} = {12/20}',
          },
        ],
      },
      {
        title: 'Skracanie ułamka',
        blocks: [
          { type: 'rule', title: 'Reguła', text: 'Skrócić ułamek to **podzielić** licznik i mianownik przez tę samą liczbę. Ułamek jest **nieskracalny**, gdy licznik i mianownik nie mają wspólnego dzielnika większego od 1.' },
          { type: 'p', text: 'Najszybciej skracamy przez największy wspólny dzielnik (NWD). Można też skracać „po kawałku” – np. najpierw przez 2, potem przez 3.' },
          {
            type: 'example',
            problem: 'Skróć ułamek {18/24}.',
            steps: ['Dzielniki 18: 1, 2, 3, 6, 9, 18. Dzielniki 24: 1, 2, 3, 4, 6, 8, 12, 24.', 'NWD(18, 24) = 6.', '{18/24} = {18:6/24:6} = {3/4}.'],
            answer: '{18/24} = {3/4}',
          },
          { type: 'list', items: ['Przez 2 dzielą się liczby parzyste.', 'Przez 3 – gdy suma cyfr dzieli się przez 3.', 'Przez 5 – gdy ostatnia cyfra to 0 lub 5.', 'Przez 10 – gdy ostatnia cyfra to 0.'] },
        ],
      },
      {
        title: 'Typowe błędy',
        blocks: [
          { type: 'mistake', wrong: '{3/5} = {3+2/5+2} = {5/7}', right: '{3/5} = {3·2/5·2} = {6/10}', why: 'Dodawanie tej samej liczby zmienia wartość ułamka. Rozszerzając, mnożymy.' },
          { type: 'mistake', wrong: '{12/18} = {6/18}', right: '{12/18} = {6/9} = {2/3}', why: 'Licznik i mianownik dzielimy przez tę samą liczbę – oba, nie tylko jeden.' },
        ],
      },
    ],
  },
  {
    id: 'mieszane',
    order: 3,
    title: 'Liczby mieszane',
    short: 'Ułamki niewłaściwe i wyłączanie całości',
    goals: ['Zamieniam liczbę mieszaną na ułamek niewłaściwy.', 'Wyłączam całości z ułamka niewłaściwego.', 'Wiem, między którymi liczbami całkowitymi leży ułamek.'],
    sections: [
      {
        title: 'Co to jest liczba mieszana',
        blocks: [
          { type: 'p', text: 'Liczba mieszana składa się z części całkowitej i ułamka właściwego, np. {2 1/3} = 2 + {1/3}. To inny zapis ułamka niewłaściwego.' },
          { type: 'visual', visual: { kind: 'bars', items: [{ num: 3, den: 3, label: '1' }, { num: 3, den: 3, label: '1' }, { num: 1, den: 3, label: '{1/3}' }] }, caption: '{2 1/3} = dwie całości i jedna trzecia, czyli {7/3}.' },
          { type: 'interactive', widget: 'mixed', text: 'Zwiększaj licznik i obserwuj, kiedy powstaje kolejna pełna całość.' },
        ],
      },
      {
        title: 'Liczba mieszana → ułamek niewłaściwy',
        blocks: [
          { type: 'rule', text: 'Licznik = część całkowita · mianownik + licznik. Mianownik się nie zmienia.' },
          { type: 'example', problem: 'Zamień {3 2/5} na ułamek niewłaściwy.', steps: ['3 · 5 = 15 (tyle piątych jest w 3 całościach).', '15 + 2 = 17.'], answer: '{3 2/5} = {17/5}' },
        ],
      },
      {
        title: 'Ułamek niewłaściwy → liczba mieszana',
        blocks: [
          { type: 'rule', text: 'Dzielimy licznik przez mianownik z resztą. Wynik to całości, reszta to nowy licznik.' },
          { type: 'example', problem: 'Wyłącz całości z ułamka {23/4}.', steps: ['23 : 4 = 5 reszty 3.', 'Całości: 5, licznik: 3, mianownik: 4.'], answer: '{23/4} = {5 3/4}' },
        ],
      },
      {
        title: 'Typowe błędy',
        blocks: [
          { type: 'mistake', wrong: '{2 1/3} = {3/3}', right: '{2 1/3} = {7/3}', why: 'Część całkowitą trzeba pomnożyć przez mianownik, a nie po prostu dodać do licznika.' },
        ],
      },
    ],
  },
  {
    id: 'porownywanie',
    order: 4,
    title: 'Porównywanie ułamków',
    short: 'Który ułamek jest większy?',
    goals: ['Porównuję ułamki o równych licznikach lub mianownikach.', 'Porównuję dowolne ułamki przez sprowadzenie do wspólnego mianownika.', 'Potrafię wskazać ułamek leżący między dwoma innymi.'],
    sections: [
      {
        title: 'Równe mianowniki lub równe liczniki',
        blocks: [
          { type: 'rule', title: 'Równe mianowniki', text: 'Większy jest ułamek o **większym liczniku**: {5/9} > {2/9}.' },
          { type: 'rule', title: 'Równe liczniki', text: 'Większy jest ułamek o **mniejszym mianowniku**: {1/3} > {1/5}.' },
          { type: 'visual', visual: { kind: 'bars', items: [{ num: 1, den: 3, label: '{1/3}' }, { num: 1, den: 5, label: '{1/5}' }] }, caption: 'Im na więcej części dzielimy całość, tym mniejsze są te części.' },
          { type: 'interactive', widget: 'compare' },
        ],
      },
      {
        title: 'Dowolne ułamki',
        blocks: [
          { type: 'p', text: 'Sprowadzamy ułamki do wspólnego mianownika i porównujemy liczniki. Można też zamienić ułamki na dziesiętne albo porównać każdy z {1/2}.' },
          {
            type: 'example',
            problem: 'Porównaj {5/6} i {7/9}.',
            steps: ['Wspólny mianownik: 18.', '{5/6} = {15/18}, {7/9} = {14/18}.', '15 > 14.'],
            answer: '{5/6} > {7/9}',
          },
          { type: 'p', text: '**Sztuczka:** ułamki typu {n/n+1} (np. {3/4}, {4/5}, {5/6}) rosną – im większe n, tym bliżej 1.' },
        ],
      },
      {
        title: 'Typowe błędy',
        blocks: [
          { type: 'mistake', wrong: '{1/8} > {1/4}, bo 8 > 4', right: '{1/8} < {1/4}', why: 'Większy mianownik oznacza mniejsze części.' },
        ],
      },
    ],
  },
  {
    id: 'dodawanie',
    order: 5,
    title: 'Dodawanie i odejmowanie',
    short: 'Wspólny mianownik, liczby mieszane',
    goals: ['Dodaję i odejmuję ułamki o różnych mianownikach.', 'Dodaję i odejmuję liczby mieszane.', 'Podaję wynik w najprostszej postaci.'],
    sections: [
      {
        title: 'Ten sam mianownik',
        blocks: [
          { type: 'rule', text: 'Dodajemy (odejmujemy) liczniki, mianownik **przepisujemy**: {2/7} + {3/7} = {5/7}.' },
        ],
      },
      {
        title: 'Różne mianowniki',
        blocks: [
          { type: 'rule', text: 'Najpierw sprowadzamy ułamki do wspólnego mianownika (najlepiej najmniejszego – NWW mianowników), potem dodajemy liczniki.' },
          { type: 'interactive', widget: 'add' },
          {
            type: 'example',
            problem: 'Oblicz {3/4} + {1/6}.',
            steps: ['NWW(4, 6) = 12.', '{3/4} = {9/12}, {1/6} = {2/12}.', '{9/12} + {2/12} = {11/12}.'],
            answer: '{11/12}',
          },
        ],
      },
      {
        title: 'Liczby mieszane',
        blocks: [
          { type: 'p', text: 'Możemy dodawać osobno całości i osobno części ułamkowe. Przy odejmowaniu, gdy część ułamkowa jest za mała, „pożyczamy” jedną całość – albo zamieniamy obie liczby na ułamki niewłaściwe.' },
          {
            type: 'example',
            problem: 'Oblicz {3 1/4} − {1 2/3}.',
            steps: ['Wspólny mianownik 12: {3 3/12} − {1 8/12}.', '{3/12} < {8/12}, więc pożyczamy całość: {3 3/12} = {2 15/12}.', '{2 15/12} − {1 8/12} = {1 7/12}.'],
            answer: '{1 7/12}',
          },
        ],
      },
      {
        title: 'Typowe błędy',
        blocks: [
          { type: 'mistake', wrong: '{1/2} + {1/3} = {2/5}', right: '{1/2} + {1/3} = {3/6} + {2/6} = {5/6}', why: 'Nie dodaje się mianowników. Mianownik mówi, jakie są części – musi być wspólny.' },
          { type: 'mistake', wrong: '{2/9} + {4/9} = {6/18}', right: '{2/9} + {4/9} = {6/9} = {2/3}', why: 'Przy wspólnym mianowniku dodajemy tylko liczniki.' },
        ],
      },
    ],
  },
  {
    id: 'mnozenie',
    order: 6,
    title: 'Mnożenie i dzielenie',
    short: 'Odwrotność, skracanie „na krzyż”',
    goals: ['Mnożę ułamki i liczby mieszane.', 'Wyznaczam odwrotność liczby.', 'Dzielę przez ułamek, mnożąc przez odwrotność.'],
    sections: [
      {
        title: 'Mnożenie',
        blocks: [
          { type: 'rule', text: 'Licznik mnożymy przez licznik, mianownik przez mianownik: {a/b} · {c/d} = {a·c/b·d}. Wspólny mianownik **nie jest potrzebny**.' },
          { type: 'interactive', widget: 'multiply', text: 'Mnożenie ułamków to „część z części”. Zmieniaj ułamki i licz kratki zamalowane podwójnie.' },
          { type: 'p', text: 'Przed mnożeniem warto skracać – także „na krzyż” (licznik jednego ułamka z mianownikiem drugiego).' },
          {
            type: 'example',
            problem: 'Oblicz {4/9} · {3/8}.',
            steps: ['Skracamy 4 z 8 (przez 4) i 3 z 9 (przez 3).', 'Zostaje {1/3} · {1/2}.', '= {1/6}.'],
            answer: '{1/6}',
          },
          { type: 'rule', title: 'Liczby mieszane', text: 'Najpierw zamieniamy je na ułamki niewłaściwe: {1 1/2} · {2/3} = {3/2} · {2/3} = 1.' },
        ],
      },
      {
        title: 'Odwrotność i dzielenie',
        blocks: [
          { type: 'rule', title: 'Odwrotność', text: 'Odwrotnością {a/b} jest {b/a}, bo ich iloczyn wynosi 1. Odwrotność 5 to {1/5}. Zero nie ma odwrotności.' },
          { type: 'rule', title: 'Dzielenie', text: 'Dzielenie przez ułamek zamieniamy na mnożenie przez jego odwrotność: {a/b} : {c/d} = {a/b} · {d/c}.' },
          {
            type: 'example',
            problem: 'Oblicz {2 1/4} : {3/8}.',
            steps: ['{2 1/4} = {9/4}.', '{9/4} : {3/8} = {9/4} · {8/3}.', 'Skracamy: {3/1} · {2/1} = 6.'],
            answer: '6',
          },
        ],
      },
      {
        title: 'Typowe błędy',
        blocks: [
          { type: 'mistake', wrong: '{2/3} · 4 = {8/12}', right: '{2/3} · 4 = {8/3}', why: 'Liczba naturalna 4 to {4/1} – mnożymy tylko licznik.' },
          { type: 'mistake', wrong: '{1/2} : {1/4} = {1/8}', right: '{1/2} : {1/4} = {1/2} · 4 = 2', why: 'Przy dzieleniu odwracamy dzielnik i mnożymy. Pytanie brzmi: ile razy {1/4} mieści się w {1/2}?' },
        ],
      },
    ],
  },
  {
    id: 'dziesietne',
    order: 7,
    title: 'Ułamki dziesiętne',
    short: 'Zamiana zapisów, rozwinięcia okresowe',
    goals: ['Zamieniam ułamek zwykły na dziesiętny i odwrotnie.', 'Wiem, kiedy rozwinięcie dziesiętne jest skończone.', 'Zapisuję rozwinięcia okresowe, np. 0,(3).'],
    sections: [
      {
        title: 'Ułamek zwykły → dziesiętny',
        blocks: [
          { type: 'p', text: 'Sposób 1: rozszerzamy ułamek do mianownika 10, 100, 1000… Sposób 2: dzielimy licznik przez mianownik.' },
          { type: 'example', problem: 'Zapisz {7/20} jako ułamek dziesiętny.', steps: ['{7/20} = {35/100} (mnożymy przez 5).', '{35/100} = 0,35.'], answer: '0,35' },
          { type: 'list', items: ['{1/2} = 0,5', '{1/4} = 0,25', '{3/4} = 0,75', '{1/5} = 0,2', '{1/8} = 0,125'] },
        ],
      },
      {
        title: 'Ułamek dziesiętny → zwykły',
        blocks: [
          { type: 'rule', text: 'Liczba cyfr po przecinku mówi, jaki jest mianownik: 1 cyfra → 10, 2 cyfry → 100, 3 cyfry → 1000. Potem skracamy.' },
          { type: 'example', problem: 'Zapisz 0,45 jako ułamek zwykły.', steps: ['0,45 = {45/100}.', 'Skracamy przez 5: {9/20}.'], answer: '{9/20}' },
        ],
      },
      {
        title: 'Rozwinięcia okresowe',
        blocks: [
          { type: 'rule', text: 'Ułamek nieskracalny ma **skończone** rozwinięcie dziesiętne tylko wtedy, gdy jego mianownik rozkłada się wyłącznie na czynniki 2 i 5.' },
          { type: 'p', text: 'W pozostałych przypadkach dzielenie nigdy się nie kończy, a cyfry się powtarzają. Powtarzającą się część (okres) zapisujemy w nawiasie: {1/3} = 0,333… = 0,(3); {1/6} = 0,1666… = 0,1(6).' },
          { type: 'interactive', widget: 'decimal', text: 'Sprawdź różne mianowniki: które dają rozwinięcie skończone, a które okresowe?' },
        ],
      },
      {
        title: 'Typowe błędy',
        blocks: [
          { type: 'mistake', wrong: '{3/8} = 3,8', right: '{3/8} = 3 : 8 = 0,375', why: 'Kreska ułamkowa oznacza dzielenie, a nie przecinek.' },
          { type: 'mistake', wrong: '{1/3} = 0,3', right: '{1/3} = 0,(3)', why: '0,3 = {3/10}, a to mniej niż {1/3}. 0,3 to tylko przybliżenie.' },
        ],
      },
    ],
  },
  {
    id: 'kolejnosc',
    order: 8,
    title: 'Kolejność działań',
    short: 'Wyrażenia z ułamkami, potęgi, nawiasy',
    goals: ['Stosuję kolejność działań w wyrażeniach z ułamkami.', 'Obliczam potęgi ułamków.', 'Łączę ułamki zwykłe i dziesiętne w jednym wyrażeniu.'],
    sections: [
      {
        title: 'Kolejność wykonywania działań',
        blocks: [
          {
            type: 'list',
            items: ['1. Działania w nawiasach.', '2. Potęgowanie (i pierwiastkowanie).', '3. Mnożenie i dzielenie – od lewej do prawej.', '4. Dodawanie i odejmowanie – od lewej do prawej.'],
          },
          {
            type: 'example',
            problem: 'Oblicz {1/2} + {1/3} · {3/4}.',
            steps: ['Najpierw mnożenie: {1/3} · {3/4} = {1/4}.', 'Potem dodawanie: {1/2} + {1/4} = {3/4}.'],
            answer: '{3/4}',
          },
        ],
      },
      {
        title: 'Potęgi ułamków',
        blocks: [
          { type: 'rule', text: '({a/b})² = {a·a/b·b}. Do potęgi podnosimy i licznik, i mianownik: ({2/3})² = {4/9}.' },
          { type: 'p', text: 'Uwaga: ({2/3})² ≠ {2²/3} – bez nawiasu potęga dotyczy tylko licznika.' },
        ],
      },
      {
        title: 'Ułamki zwykłe i dziesiętne razem',
        blocks: [
          { type: 'p', text: 'Najczęściej wygodniej zamienić ułamki dziesiętne na zwykłe (0,5 = {1/2}, 0,25 = {1/4}, 0,2 = {1/5}), szczególnie gdy w wyrażeniu jest np. {1/3}, którego nie da się zapisać dokładnie w postaci dziesiętnej.' },
          {
            type: 'example',
            problem: 'Oblicz 0,75 · {2/3} − {1/6}.',
            steps: ['0,75 = {3/4}.', '{3/4} · {2/3} = {1/2}.', '{1/2} − {1/6} = {3/6} − {1/6} = {2/6} = {1/3}.'],
            answer: '{1/3}',
          },
        ],
      },
      {
        title: 'Typowe błędy',
        blocks: [
          { type: 'mistake', wrong: '{1/2} + {1/2} · 4 = 1 · 4 = 4', right: '{1/2} + {1/2} · 4 = {1/2} + 2 = {2 1/2}', why: 'Mnożenie ma pierwszeństwo przed dodawaniem.' },
        ],
      },
    ],
  },
  {
    id: 'tekstowe',
    order: 9,
    title: 'Zadania tekstowe',
    short: 'Ułamek liczby, obliczanie całości',
    goals: ['Obliczam ułamek danej liczby.', 'Obliczam liczbę, gdy znam jej część.', 'Rozwiązuję zadania tekstowe z ułamkami krok po kroku.'],
    sections: [
      {
        title: 'Ułamek liczby',
        blocks: [
          { type: 'rule', text: '{a/b} liczby N = N · {a/b} = (N : b) · a.' },
          { type: 'example', problem: 'Oblicz {3/5} liczby 40.', steps: ['{1/5} liczby 40 to 40 : 5 = 8.', '{3/5} to 3 · 8 = 24.'], answer: '24' },
        ],
      },
      {
        title: 'Liczba, gdy znamy jej część',
        blocks: [
          { type: 'rule', text: 'Jeśli {a/b} liczby to P, to cała liczba = P : {a/b} = (P : a) · b.' },
          { type: 'example', problem: '{2/7} uczniów szkoły to 60 osób. Ilu uczniów jest w szkole?', steps: ['{2/7} → 60, więc {1/7} → 30.', 'Całość {7/7} → 7 · 30 = 210.'], answer: '210 uczniów' },
        ],
      },
      {
        title: 'Jak rozwiązywać zadania tekstowe',
        blocks: [
          {
            type: 'list',
            items: [
              '1. Przeczytaj zadanie dwa razy. Ustal, co jest **całością**.',
              '2. Zapisz dane i to, czego szukasz.',
              '3. Zastanów się: szukam części (mnożę) czy całości (dzielę)?',
              '4. Licz krok po kroku i zapisuj wyniki pośrednie.',
              '5. Sprawdź, czy wynik ma sens, i zapisz odpowiedź z jednostką.',
            ],
          },
          { type: 'p', text: 'Uważaj na sformułowanie „pozostałej części” – wtedy całością jest to, co zostało, a nie wszystko na początku.' },
        ],
      },
    ],
  },
];

export const TOPIC_BY_ID: Record<TopicId, Topic> = Object.fromEntries(TOPICS.map((t) => [t.id, t])) as Record<TopicId, Topic>;
