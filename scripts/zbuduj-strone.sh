#!/usr/bin/env bash
# Składa gotową stronę do wgrania na serwer (np. home.pl):
#   strona sprzedażowa w katalogu głównym, aplikacja w /aplikacja/.
# Użycie: npm run build:site   (opcjonalnie VITE_AI_URL=https://… dla lekcji z AI)
set -euo pipefail
cd "$(dirname "$0")/.."
npm run build
OUT=wydanie/strona-na-serwer
rm -rf "$OUT"
mkdir -p "$OUT/aplikacja"
cp landing/index.html landing/polityka-prywatnosci.html landing/regulamin.html landing/legal.css "$OUT/"
cp -r landing/fonts landing/img "$OUT/"
cp -r dist/. "$OUT/aplikacja/"
cp deploy/.htaccess deploy/robots.txt "$OUT/"
( cd wydanie && rm -f strona-na-serwer.zip && zip -qr strona-na-serwer.zip strona-na-serwer )
echo "Gotowe: $OUT (oraz wydanie/strona-na-serwer.zip)"
