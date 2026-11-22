# E-tutor – strona sprzedażowa: zasady wyglądu

Ten plik opisuje wygląd strony `landing/index.html`. Przy każdej zmianie strony (także przez Claude) trzymaj się tych zasad, żeby strona nie wyglądała jak z szablonu.

## Pomysł

Kartka z zeszytu w kratkę. Nagłówek strony leży na kratce 5 mm z czerwonym marginesem. Dopiski czerwonym długopisem przy zrzutach ekranu są jak uwagi nauczyciela na marginesie. Dalej strona jest spokojna: biała kartka, granatowy atrament, jeden niebieski kolor przycisków (ten sam co w aplikacji).

## Kolory (tokeny w `:root`)

| Token | Jasny | Ciemny | Do czego |
| --- | --- | --- | --- |
| `--paper` | `#fbfcfd` | `#11151c` | tło całej strony, wszystkich sekcji |
| `--grid` | `#dfe6ef` | `#1f2632` | kratka w nagłówku |
| `--ink` | `#17223a` | `#e8ecf3` | tekst, obramowania ramek |
| `--ink-2` | `#4f5b70` | `#a7b0c0` | tekst pomocniczy |
| `--rule` | `#d5dce6` | `#2a3240` | linie podziału |
| `--accent` | `#3462c9` | `#86a8f2` | przyciski, linki (kolor aplikacji) |
| `--pen` | `#c8372d` | `#ff8a7a` | **tylko** dopiski, margines, przekreślona cena |
| `--marker` | `#ffe270` | `#6b5a12` | **tylko** jedno zakreślenie w nagłówku |
| `--ok` | `#2f7d4f` | `#6cc58f` | ptaszki, „gotowe” |

Strona ma jasny i ciemny motyw. Każdy kolor bierz z tokenu, nigdy wpisany na sztywno.

**Jedno tło dla całej strony.** Żadna sekcja nie dostaje innego koloru tła (zwłaszcza ciemnego pasa na jasnej stronie ani jasnego na ciemnej). Sekcje oddzielamy cienką linią `--rule`, a ważne bloki (telefon, formularz) ramką 2 px w kolorze `--ink` z przesuniętym cieniem.

## Czcionki (Google Fonts)

- **Bricolage Grotesque**: nagłówki (700–800, lekko ściśnięte).
- **IBM Plex Sans**: tekst.
- **IBM Plex Mono**: małe etykiety nad nagłówkami, data egzaminu, numery w spisie treści.
- **Caveat**: tylko dopiski „długopisem” przy zrzutach, najwyżej jeden przy zrzucie.

## Zasady (13 punktów anty-„AI-look”)

1. Żadnych gradientów fioletowo-niebieskich. Kolory płaskie, kratka to jedyny wzór.
2. Prawdziwe czcionki z polskimi znakami (lista wyżej), nie systemowe ani Inter.
3. Bez szablonowych elementów: menu z 6 linkami, stopka z kolumnami linków, „© All rights reserved”, baner cookies, przycisk czatu.
4. Bez rzędu trzech jednakowych kart. Używamy: listy kroków, wierszy zrzut/tekst na przemian, spisu treści, tabeli.
5. Ikony jako SVG rysowane linią (styl Lucide), nigdy emoji.
6. Tylko prawdziwe zrzuty ekranu aplikacji (`landing/img/`). Bez zdjęć ze stocku i rysunków „laptop z wykresem”.
7. Konkretny nagłówek: liczby i fakty („10 minut dziennie”, „11 maja 2027”), nie „Odkryj potencjał nauki”.
8. Bez animacji pojawiania się treści przy przewijaniu: tekst i zrzuty są widoczne od razu. Dozwolony ruch:
   - wejście nagłówka przy wczytaniu strony (tekst i telefon lekko podjeżdżają, zakreślacz przeciąga się pod „10 minut”),
   - dopiski długopisem „piszą się”, gdy pojawią się na ekranie (to ozdoba, nie treść),
   - hover: telefon i formularz unoszą się o 3 px, przyciski o 1 px, strzałki w przyciskach drgną,
   - płynne przewijanie do sekcji, rozwijanie pytań, pojawienie się komunikatu formularza.
   Czasy 0,15–0,8 s, bez sprężynek i odbić. Przy „ogranicz animacje” w systemie cały ruch jest wyłączony.
9. Bez wymyślonych opinii. Gdy będą prawdziwe, dodaj je z imieniem, klasą dziecka i zgodą autora.
10. Bez resztek po kreatorach: lorem ipsum, linki `href="#"`, „Made with…”, nieużywane klasy.
11. (pominięte: nie mamy jeszcze strony-wzoru.)
12. Ten plik jest „plikiem wyglądu”. Zmieniasz styl, to najpierw zmień go tutaj.
13. Po każdej zmianie zrób zrzuty ekranu (komputer 1366 px, telefon 390 px, jasny i ciemny) i obejrzyj je przed publikacją. Skrypt: `node scripts/landing-screenshots.cjs` (wymaga uruchomionego `npx serve landing` lub `python3 -m http.server -d landing 8088`).

## Układ

- Szerokość treści do 1120 px, marginesy boczne min. 16 px.
- Poniżej 860 px wszystko w jednej kolumnie, dopiski długopisem znikają (nie ma na nie miejsca).
- Zrzuty ekranu w ramce telefonu: obramowanie 2 px w kolorze `--ink`, cień przesunięty (8 px, 8 px) bez rozmycia.
- Numeracja tylko tam, gdzie kolejność coś znaczy (kroki nauki, działy w spisie treści).

## Teksty

Piszemy do rodzica, prosto i krótko. Konkretne liczby z aplikacji (18 zadań testu, ostatnie 12 zadań, progi 50% i 85%, powtórki po 2, 4, 7, 14, 30, 60 dniach). Nie obiecujemy rzeczy, których jeszcze nie ma: wszystko, co powstaje, jest w spisie treści oznaczone jako „w przygotowaniu”.

## Do ustawienia przed startem

W `index.html`, w skrypcie na dole strony:
- `FORM_ENDPOINT`: adres, pod który idą zapisy (np. Formspree). Bez niego formularz pokazuje komunikat, że zapisy jeszcze nie działają.
- `EXAM`: termin egzaminu (odliczanie tygodni).
- Linki „Wypróbuj ułamki” (klasa `js-app-link`) prowadzą do aplikacji.
