/** Dział: Ułamki – korzysta z generatorów i teorii pierwszego modułu. */
import { TOPIC_BY_ID } from '../../topics';
import type { Generator, TheoryBlock, TopicId } from '../../types';
import { numberLinePoint, shadedBar, unitPart, simplifyTask, extendTask, equivalentChoice, mixedToImproper, improperToMixed, mixedOnLineChoice } from '../../tasks/basics';
import { compareTask, largestChoice, betweenTask, addSubTask, missingAddend, mulDivTask, reciprocalChoice } from '../../tasks/operations';
import { toDecimal, fromDecimal, periodicChoice, finiteChoice, orderTask as orderOfOps, orderChoice, fractionOfNumber, wholeFromPart, wordProblem } from '../../tasks/advanced';
import { lineTask, matchDecimalTask, matchEquivalentTask, orderTask as orderCards, shadeTask } from '../../tasks/interactive';
import { pick } from '../kit';
import type { Skill, Zone } from '../model';

/** Bloki teorii z sekcji pierwszego modułu (po tytule sekcji). */
function sec(topic: TopicId, ...titles: string[]): TheoryBlock[] {
  const t = TOPIC_BY_ID[topic];
  return titles.flatMap((title) => t.sections.find((s) => s.title === title)?.blocks ?? []).filter((b) => b.type !== 'interactive');
}

/** Łączy kilka generatorów – każde zadanie losuje jeden z nich. */
const any =
  (...gens: Generator[]): Generator =>
  (d, r) =>
    pick(r, gens)(d, r);

const S = (id: string, title: string, theory: TheoryBlock[], gen: Generator): Skill => ({ id: `u-${id}`, title, theory, gen });

export const ULAMKI: Zone = {
  id: 'ulamki',
  title: 'Ułamki',
  short: 'Ułamki zwykłe i dziesiętne: od pojęcia ułamka do zadań tekstowych.',
  mark: '½',
  extraLink: { label: 'Teoria i laboratoria ułamków', href: '#/material' },
  skills: [
    S('czym-jest', 'Czym jest ułamek', sec('pojecie', 'Licznik i mianownik'), any(shadedBar, (d, r) => shadeTask(d, r))),
    S('kreska', 'Kreska ułamkowa to dzielenie', sec('pojecie', 'Kreska ułamkowa to dzielenie'), unitPart),
    S('os', 'Ułamek na osi liczbowej', sec('pojecie', 'Ułamek na osi liczbowej'), any(numberLinePoint, (d, r) => lineTask(d, r, 'pojecie'))),
    S('rozszerzanie', 'Rozszerzanie ułamków', sec('skracanie', 'Rozszerzanie ułamka'), extendTask),
    S('skracanie', 'Skracanie ułamków', sec('skracanie', 'Skracanie ułamka'), simplifyTask),
    S('rowne', 'Ułamki równe', sec('skracanie', 'Rozszerzanie ułamka', 'Skracanie ułamka'), any(equivalentChoice, (d, r) => matchEquivalentTask(d, r))),
    S('mieszane', 'Liczby mieszane', sec('mieszane', 'Co to jest liczba mieszana'), any(mixedOnLineChoice, (d, r) => lineTask(d, r, 'mieszane'))),
    S('na-niewlasciwy', 'Liczba mieszana → ułamek niewłaściwy', sec('mieszane', 'Liczba mieszana → ułamek niewłaściwy'), mixedToImproper),
    S('na-mieszana', 'Ułamek niewłaściwy → liczba mieszana', sec('mieszane', 'Ułamek niewłaściwy → liczba mieszana'), improperToMixed),
    S('porownywanie', 'Porównywanie ułamków', sec('porownywanie', 'Równe mianowniki lub równe liczniki', 'Dowolne ułamki'), compareTask),
    S('najwiekszy', 'Największy i najmniejszy ułamek', sec('porownywanie', 'Dowolne ułamki'), any(largestChoice, (d, r) => orderCards(d, r))),
    S('pomiedzy', 'Ułamek między dwoma ułamkami', sec('porownywanie', 'Dowolne ułamki'), betweenTask),
    S('dodawanie', 'Dodawanie i odejmowanie ułamków', sec('dodawanie', 'Ten sam mianownik', 'Różne mianowniki'), addSubTask),
    S('mieszane-dod', 'Dodawanie liczb mieszanych', sec('dodawanie', 'Liczby mieszane'), addSubTask),
    S('brakujacy', 'Brakujący składnik', sec('dodawanie', 'Różne mianowniki'), missingAddend),
    S('mnozenie', 'Mnożenie i dzielenie ułamków', sec('mnozenie', 'Mnożenie', 'Odwrotność i dzielenie'), mulDivTask),
    S('odwrotnosc', 'Odwrotność liczby', sec('mnozenie', 'Odwrotność i dzielenie'), reciprocalChoice),
    S('na-dziesietny', 'Ułamek zwykły → dziesiętny', sec('dziesietne', 'Ułamek zwykły → dziesiętny'), toDecimal),
    S('z-dziesietnego', 'Ułamek dziesiętny → zwykły', sec('dziesietne', 'Ułamek dziesiętny → zwykły'), fromDecimal),
    S('dziesietne-pary', 'Ułamki dziesiętne na osi i w parach', sec('dziesietne', 'Ułamek zwykły → dziesiętny'), any((d, r) => matchDecimalTask(d, r), (d, r) => lineTask(d, r, 'dziesietne'))),
    S('okresowe', 'Rozwinięcia okresowe', sec('dziesietne', 'Rozwinięcia okresowe'), periodicChoice),
    S('skonczone', 'Kiedy rozwinięcie jest skończone', sec('dziesietne', 'Rozwinięcia okresowe'), finiteChoice),
    S('kolejnosc', 'Kolejność działań na ułamkach', sec('kolejnosc', 'Kolejność wykonywania działań', 'Potęgi ułamków'), any(orderOfOps, orderChoice)),
    S('ulamek-liczby', 'Ułamek danej liczby', sec('tekstowe', 'Ułamek liczby'), fractionOfNumber),
    S('calosc', 'Liczba, gdy znamy jej część', sec('tekstowe', 'Liczba, gdy znamy jej część'), wholeFromPart),
    S('tekstowe', 'Zadania tekstowe z ułamkami', sec('tekstowe', 'Jak rozwiązywać zadania tekstowe'), wordProblem),
  ],
};
