# E-tutor – matematyka dla klasy 8 (prototyp)

Prototyp aplikacji do samodzielnej nauki matematyki. Pierwszy moduł: **ułamki** (powtórka przed egzaminem ósmoklasisty). Interfejs po polsku.

## Uruchomienie

```bash
npm install
npm run dev      # serwer deweloperski: http://localhost:5173
npm test         # testy jednostkowe (arytmetyka, sprawdzanie odpowiedzi, generatory zadań)
npm run build    # wersja produkcyjna w katalogu dist/
```

Aplikacja działa w całości w przeglądarce (komputer, tablet, telefon). Postępy zapisują się lokalnie w przeglądarce (localStorage), bez logowania.

## Co jest w prototypie

| Obszar | Zawartość |
| --- | --- |
| **Materiał** | 9 działów: pojęcie ułamka i oś liczbowa · skracanie/rozszerzanie · liczby mieszane · porównywanie · dodawanie/odejmowanie · mnożenie/dzielenie · ułamki dziesiętne (też okresowe) · kolejność działań · zadania tekstowe |
| **Teoria** | Dla każdego działu: „Co musisz umieć”, reguły, rysunki (paski, oś liczbowa), przykłady z rozwiązaniem, typowe błędy. Każdą sekcję można odsłuchać. |
| **Zadania** | Generowane automatycznie (nie kończą się), 3 poziomy trudności, formy: wpisanie wyniku, wybór A–D, prawda/fałsz. 12 ręcznie napisanych zadań tekstowych. |
| **Pomoc** | Kolejne podpowiedzi, tryb **krok po kroku**, pełne rozwiązanie, komunikaty dla typowych błędów (np. dodanie mianowników). |
| **Test diagnostyczny** | 18 zadań (po 2 z działu) – ustawia startowy poziom w każdym dziale. |
| **Próbny arkusz** | 10 zadań zamkniętych + 2 prawda/fałsz + 3 otwarte, limit czasu, punktacja, raport z działami do powtórki i przeglądem rozwiązań. |
| **Postępy** | Opanowanie 0–100% w każdym dziale (🔴 do powtórki < 50%, 🟡 w trakcie, 🟢 opanowane ≥ 85%), powtórki w odstępach, najczęstsze błędy, kalendarz nauki, historia arkuszy. |
| **Motywacja** | Dzienny cel (minuty), kalendarz bez „tracenia serii”, odznaki. Każdy element można wyłączyć. |
| **Ustawienia** | Zestawy (Spokojnie / Standard / Przed egzaminem) + tempo, trudność, zegar, podpowiedzi, liczba prób, szczegółowość rozwiązań, głos (wybór, tempo, wysokość, głośność, czytanie automatyczne), motyw jasny/ciemny, rozmiar tekstu, wysoki kontrast, czcionka OpenDyslexic, odstępy, ograniczenie animacji, dźwięki, eksport/import postępów. |

## Jak liczone jest opanowanie

- Bierzemy ostatnie 12 zadań z działu; nowsze ważą więcej.
- Zadanie bez pomocy = 1. Każda podpowiedź lub kolejna próba: −0,25. Tryb krok po kroku: −0,25. Pokazanie rozwiązania lub błąd = 0.
- Zadania z poziomu 1 liczą się maksymalnie na 0,8, więc samymi łatwymi zadaniami nie da się „opanować” działu.
- Opanowany dział wraca do odświeżenia po 2, 4, 7, 14, 30, 60 dniach (powtórki w odstępach).
- Poziom trudności w trybie automatycznym: opanowanie < 50% → łatwy, < 80% → średni, wyżej → trudny.

Wszystkie progi są w `src/state/progress.ts`.

## Struktura kodu

```
src/
  lib/            fraction.ts (dokładna arytmetyka), parse.ts (odczyt odpowiedzi),
                  spoken.ts (odczyt ułamków po polsku dla lektora), speech.ts (Web Speech API)
  content/        topics.ts (teoria), tasks/ (generatory zadań, arkusz, diagnoza), types.ts
  state/          ustawienia, postępy, odznaki, rekomendacje, zapis lokalny
  components/     MathText (ułamki piętrowe), TaskView (rozwiązywanie zadania), wizualizacje, UI
  screens/        Start, Materiał, Teoria, Ćwiczenia, Egzamin, Diagnoza, Postępy, Ustawienia
```

Notacja w treściach: `{3/4}` – ułamek, `{2 1/3}` – liczba mieszana, `**tekst**` – pogrubienie.

## Kolejne kroki (propozycje)

- **Wersje EN/UK:** wyciągnąć napisy interfejsu do plików językowych i przygotować `content/en`, `content/uk` (teoria i szablony zadań). Odczyt liczb dla lektora (`spoken.ts`) wymaga osobnej wersji dla każdego języka.
- **Panel rodzica/nauczyciela i profile** (odłożone) – zapis jest już podzielony według profilu (`state/storage.ts`).
- **Konta i synchronizacja** (np. Supabase) w miejsce localStorage.
- **Tutor AI** (np. Claude) – pytania „dlaczego?” do konkretnego kroku rozwiązania; wymaga serwera i zasad bezpieczeństwa dla dzieci.
- Lepszy głos (usługa TTS), więcej ręcznie pisanych zadań, punktowanie metody w zadaniach otwartych.
