# Serwer lekcji z AI (Claude)

Mały serwer (Cloudflare Worker), który przygotowuje „lekcje na zamówienie” w aplikacji E-tutor. Uczeń pisze, czego nie rozumie, a serwer prosi Claude o lekcję: krótką teorię, dwa przykłady i 6 zadań.

Klucz API trzymamy **tylko na serwerze**. Aplikacja nigdy go nie widzi.

## Jak to działa

1. Aplikacja wysyła `POST /lekcja` z tematem, poziomem, (opcjonalnie) działem i zainteresowaniami ucznia.
2. Serwer sprawdza dzienny limit (domyślnie 5 lekcji na urządzenie, 30 na adres IP).
3. Claude dostaje stałe instrukcje (`src/prompt.ts`): tylko matematyka z klas 4–8, tylko po polsku, język dla dzieci, odmowa przy tematach spoza matematyki lub niestosownych. Odpowiedź musi pasować do schematu JSON (`src/schema.ts`).
4. Każde zadanie ma wynik **i** wyrażenie do sprawdzenia (np. `15/100*240`). Aplikacja sama liczy to wyrażenie i **odrzuca zadania, w których wynik się nie zgadza** (`src/lib/expr.ts`, `src/lib/ai.ts`). Dzięki temu uczeń nie dostanie zadania z błędną odpowiedzią.

## Uruchomienie (ok. 10 minut)

Potrzebne: konto Cloudflare (darmowe) i klucz API Claude z [platform.claude.com](https://platform.claude.com) (Settings → API Keys).

```bash
cd server
npm install
npx wrangler login                              # logowanie do Cloudflare w przeglądarce
npx wrangler kv namespace create LIMITS         # magazyn na dzienne limity
# wklej otrzymane id do wrangler.toml (sekcja [[kv_namespaces]], usuń znaki #)
npx wrangler secret put ANTHROPIC_API_KEY       # wklej klucz API, gdy wrangler o niego poprosi
npx wrangler deploy                             # wypisze adres, np. https://e-tutor-ai.twoje-konto.workers.dev
```

Potem zbuduj aplikację z adresem serwera:

```bash
cd ..
VITE_AI_URL=https://e-tutor-ai.twoje-konto.workers.dev npm run build
# albo dla Androida:
VITE_AI_URL=https://e-tutor-ai.twoje-konto.workers.dev npm run android:apk
```

Bez `VITE_AI_URL` ekran „Moja lekcja” pokazuje informację, że funkcja nie jest jeszcze włączona.

### Lokalnie (do testów)

```bash
cd server
echo "ANTHROPIC_API_KEY=twój-klucz" > .dev.vars   # plik jest w .gitignore
npx wrangler dev                                  # http://localhost:8787
# w drugim terminalu:
VITE_AI_URL=http://localhost:8787 npm run dev
```

## Ustawienia (`wrangler.toml`, sekcja `[vars]`)

| Zmienna | Domyślnie | Znaczenie |
| --- | --- | --- |
| `MODEL` | `claude-opus-5-5` | Model Claude. Najlepsza jakość lekcji. Tańsze: `claude-sonnet-5-5`, `claude-haiku-5-5`. |
| `DAILY_LIMIT` | `5` | Lekcje dziennie na jedno urządzenie (na adres IP: 6 razy więcej). |
| `ALLOWED_ORIGINS` | puste | Adresy stron, które mogą korzystać z serwera, np. `https://e-tutor.pl`. Puste = każdy. Aplikacja na Androida jest wpuszczana zawsze. |

## Koszt

Płacisz Anthropic za tokeny. Jedna lekcja to ok. 2 tys. tokenów wejścia i 4–8 tys. tokenów wyjścia (razem z „myśleniem” modelu).

| Model | Cena (wejście / wyjście za 1 mln tokenów) | Szacunkowo za lekcję |
| --- | --- | --- |
| Claude Opus 5.5 | 4 $ / 20 $ | ok. 0,10–0,17 $ (40–70 gr) |
| Claude Sonnet 5.5 | 2 $ / 10 $ | ok. 0,05–0,09 $ (20–35 gr) |
| Claude Haiku 5.5 | 0,10 $ / 0,50 $ | poniżej 1 gr |

Przy limicie 5 lekcji dziennie jeden bardzo aktywny uczeń kosztuje na Opus 5.5 najwyżej kilka złotych miesięcznie. Rzeczywisty koszt sprawdzisz w konsoli Anthropic (Usage). Ustaw tam też miesięczny limit wydatków.

## Bezpieczeństwo

- Klucz API jest sekretem Workera (`wrangler secret put`), nie trafia do repozytorium ani do aplikacji.
- Treść od ucznia jest oznaczona jako dane (`<prosba>…</prosba>`), a instrukcje mówią modelowi, żeby nie zmieniał zasad na jej podstawie.
- Model odmawia tematów spoza matematyki; przy odmowie uczeń dostaje życzliwy komunikat.
- Gdy filtr bezpieczeństwa Claude odrzuci zapytanie, API samo spróbuje innym modelem (`fallbacks: "default"`).
- Limity dzienne chronią budżet przed nadużyciem.
- Serwer niczego nie zapisuje poza licznikami limitów (wygasają po dobie). Lekcje są zapisywane tylko na urządzeniu ucznia.
