# EduKwadrat – nauka do kwadratu

Aplikacja do nauki przed egzaminem ósmoklasisty (dawniej: E-tutor).

Aplikacja do samodzielnej nauki matematyki przed egzaminem ósmoklasisty. Interfejs po polsku.

- **1016 lekcji w 10 działach** egzaminu (ułamki, liczby i działania, procenty, potęgi i pierwiastki, wyrażenia algebraiczne, równania i proporcje, geometria płaska, Pitagoras i układ współrzędnych, bryły, statystyka i prawdopodobieństwo).
- **Naturalny głos lektora** (polskie głosy neuronowe Piper działające na urządzeniu, za darmo).
- **Lekcje na zamówienie z AI** – uczeń opisuje, czego nie rozumie, a tutor (Claude) przygotowuje lekcję. Wymaga serwera: [server/README.md](server/README.md).

## Uruchomienie

```bash
npm install
npm run dev      # serwer deweloperski: http://localhost:5173
npm test         # testy: arytmetyka, sprawdzanie odpowiedzi, wszystkie generatory zadań
SEEDS=300 npm test   # dokładniejszy test generatorów (300 losowań na umiejętność)
npm run build    # wersja produkcyjna w katalogu dist/
```

Aplikacja działa w całości w przeglądarce (komputer, tablet, telefon). Postępy zapisują się lokalnie w przeglądarce (localStorage), bez logowania.

## Aplikacja na Androida (APK)

Aplikacja jest pakowana przez [Capacitor](https://capacitorjs.com) (katalog `android/`).

```bash
# wymagane: JDK 21 i Android SDK (platforma 36, build-tools 36); ścieżka SDK w android/local.properties
npm run android:apk
# plik: android/app/build/outputs/apk/release/app-release.apk
```

- W aplikacji lektor korzysta z **natywnego silnika mowy Androida** (`@capacitor-community/text-to-speech`), bo WebView nie obsługuje Web Speech API. Polski głos musi być zainstalowany w telefonie (Ustawienia → Zamiana tekstu na mowę).
- Wibracje: `@capacitor/haptics`.
- APK jest podpisany **kluczem testowym** `android/app/etutor-test.keystore` (hasło jawne w `android/app/build.gradle`). Dzięki stałemu kluczowi nowe wersje instalują się jako aktualizacja, bez utraty postępów. Do Google Play trzeba wygenerować prywatny klucz i nie trzymać go w repozytorium.
- Ikony i ekran startowy: źródła w `assets/`, generowane przez `npx capacitor-assets generate --android`.

## Lekcje (działy egzaminu)

Każdy dział ma 25–27 umiejętności (razem 254), a każda umiejętność 4 lekcje – co najmniej 100 lekcji na dział:

| Lekcja | Co zawiera |
| --- | --- |
| **Poznaj** | teoria, przykład rozwiązany krok po kroku, 4 łatwe zadania |
| **Ćwicz** | 6 zadań z podpowiedziami (część w formie A–D) |
| **Trudniej** | 6 trudniejszych zadań |
| **Sprawdzian** | 5 zadań; zalicza 4 dobre odpowiedzi |

Za lekcję uczeń dostaje 1–3 gwiazdki. Zadania są generowane (nie kończą się), mają policzone odpowiedzi, typowe błędy z wyjaśnieniem, podpowiedzi i pełne rozwiązania. Geometria ma rysunki (figury, kąty, bryły w rzucie, układ współrzędnych), statystyka – wykresy i tabele.

Kod: `src/content/curriculum/` – `zones/*.ts` (treść działów), `kit.ts` (budowanie zadań, formatowanie liczb po polsku), `figures.ts` (rysunki), `model.ts` (lekcje). Test `curriculum.test.ts` uruchamia każdą umiejętność na wielu losowaniach i sprawdza m.in., że odpowiedź da się wpisać, w zadaniach A–D jest dokładnie jedna poprawna odpowiedź, a w tekstach nie ma „NaN” ani „undefined”.

Dodanie umiejętności: dopisz `S('id', 'Tytuł', [teoria…], (d, r) => q(…))` w pliku działu – lekcje powstaną same.

## Głos lektora

- **Naturalny** (domyślny): polskie głosy Piper – Gosia, Darek, Marek. Uczeń pobiera wybrany głos raz (ok. 60 MB, Ustawienia → Głos lektora); model zostaje w pamięci przeglądarki/aplikacji (OPFS) i działa bez internetu. Synteza w przeglądarce (WebAssembly), bez serwera i bez opłat. Kod: `src/lib/neuralVoice.ts`.
- **Systemowy**: Web Speech API / silnik mowy Androida – gdy naturalny głos nie jest pobrany albo uczeń go wyłączy.
- Matematyka czytana po polsku: ułamki, potęgi („do potęgi 5”), pierwiastki, jednostki (`src/lib/spoken.ts`).

## Lekcje na zamówienie (AI)

Ekran „Moja lekcja” (Lekcje → Moja lekcja). Uczeń wpisuje temat, wybiera poziom, opcjonalnie dział i zainteresowania (do zadań tekstowych). Serwer (`server/`, Cloudflare Worker) wywołuje Claude z instrukcjami dla dzieci i schematem JSON. Aplikacja sprawdza każde zadanie własnym kalkulatorem i odrzuca te, w których wynik się nie zgadza. Lekcje zapisują się na urządzeniu. Konfiguracja i koszty: [server/README.md](server/README.md).

## Moduł ułamków (pierwsza wersja)

| Obszar | Zawartość |
| --- | --- |
| **Materiał** | 9 działów: pojęcie ułamka i oś liczbowa · skracanie/rozszerzanie · liczby mieszane · porównywanie · dodawanie/odejmowanie · mnożenie/dzielenie · ułamki dziesiętne (też okresowe) · kolejność działań · zadania tekstowe |
| **Teoria** | Dla każdego działu: „Co musisz umieć”, reguły, rysunki (paski, oś liczbowa), przykłady z rozwiązaniem, typowe błędy. Każdą sekcję można odsłuchać. |
| **Zadania** | Generowane automatycznie (nie kończą się), 3 poziomy trudności, formy: wpisanie wyniku, wybór A–D, prawda/fałsz. 12 ręcznie napisanych zadań tekstowych. |
| **Zadania interaktywne** | Zamalowywanie paska (dotyk lub przeciąganie palcem), zaznaczanie liczby na osi (dotknięcie, przeciąganie, strzałki), układanie kart w kolejności, łączenie w pary (ułamek ↔ ułamek dziesiętny, ułamki równe). |
| **Laboratoria w teorii** | 7 interaktywnych modeli z przyciskami +/−: budowanie ułamka (pasek + oś + odczyt), ułamki równe, wyłączanie całości, porównywanie, dodawanie na pasku, mnożenie na modelu prostokątnym, rozwinięcie dziesiętne (z siatką 10×10). |
| **Klawiatura ułamków** | Ekranowa klawiatura z „/”, spacją (liczby mieszane), przecinkiem i minusem – automatycznie na telefonach. Delikatne wibracje po odpowiedzi. |
| **Pomoc** | Kolejne podpowiedzi, tryb **krok po kroku**, pełne rozwiązanie, komunikaty dla typowych błędów (np. dodanie mianowników). |
| **Test sprawdzający** | 18 zadań (po 2 z działu) – ustawia startowy poziom w każdym dziale. |
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
  components/     MathText (ułamki piętrowe), TaskView (rozwiązywanie zadania), wizualizacje, UI,
                  interactive/ (pasek, oś, kolejność, pary), widgets/ (laboratoria), FractionKeypad
  screens/        Start, Materiał, Teoria, Ćwiczenia, Egzamin, Diagnoza, Postępy, Ustawienia
```

Notacja w treściach: `{3/4}` – ułamek, `{2 1/3}` – liczba mieszana, `**tekst**` – pogrubienie.

## Kolejne kroki (propozycje)

- **Wersje EN/UK:** wyciągnąć napisy interfejsu do plików językowych i przygotować `content/en`, `content/uk` (teoria i szablony zadań). Odczyt liczb dla lektora (`spoken.ts`) wymaga osobnej wersji dla każdego języka.
- **Panel rodzica/nauczyciela i profile** (odłożone) – zapis jest już podzielony według profilu (`state/storage.ts`).
- **Konta i synchronizacja** (np. Supabase) w miejsce localStorage.
- **Tutor AI w zadaniu** – pytania „dlaczego?” do konkretnego kroku rozwiązania (serwer już jest – `server/`).
- Lepszy głos (usługa TTS), więcej ręcznie pisanych zadań, punktowanie metody w zadaniach otwartych.
