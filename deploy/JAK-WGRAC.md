# Jak wgrać EduKwadrat na home.pl

Paczka `strona-na-serwer.zip` zawiera wszystko, co ma trafić na serwer:

```
.htaccess                 ustawienia serwera (https, bezpieczeństwo, pamięć podręczna)
index.html                strona sprzedażowa
polityka-prywatnosci.html
regulamin.html
legal.css, fonts/, img/   wygląd, czcionki, zrzuty ekranu
robots.txt
aplikacja/                aplikacja EduKwadrat (adres: twojadomena.pl/aplikacja/)
```

## 1. Włącz certyfikat SSL (https)

W panelu home.pl (panel.home.pl) otwórz ustawienia domeny i włącz bezpłatny certyfikat SSL. Zrób to **przed** wgraniem plików: `.htaccess` przekierowuje wszystkich na `https://`, a bez certyfikatu strona się nie otworzy.

## 2. Sprawdź, do którego katalogu prowadzi domena

W ustawieniach domeny w panelu jest katalog na serwerze, do którego jest przypięta (np. `/public_html` albo katalog z nazwą domeny). Tam trafią pliki.

## 3. Wgraj pliki

Rozpakuj `strona-na-serwer.zip` na komputerze. Wgraj **zawartość** folderu `strona-na-serwer` (nie sam folder) do katalogu domeny. Do wyboru:

- **Menedżer plików / WebFTP w panelu home.pl:** wybierz katalog domeny i wyślij pliki oraz foldery.
- **Program FTP (np. FileZilla):** dane do połączenia (serwer, login, hasło) są w panelu home.pl w ustawieniach FTP usługi hostingowej.

Plik `.htaccess` zaczyna się od kropki, więc na Macu i w niektórych programach jest ukryty. Upewnij się, że też został wgrany (w FileZilli: Serwer → Wymuś pokazywanie ukrytych plików).

Jeśli w katalogu domeny są stare pliki (np. strona startowa home.pl `index.html`), zastąp je.

## 4. Sprawdź

- `https://twojadomena.pl` – strona sprzedażowa, na dole komunikat o cookies,
- przycisk „Wypróbuj ułamki” – otwiera `https://twojadomena.pl/aplikacja/`,
- `https://twojadomena.pl/polityka-prywatnosci.html` i `/regulamin.html`.

Jeśli zamiast strony widać błąd 500, usuń z serwera plik `.htaccess` i napisz, co się stało – to znaczy, że serwer nie obsługuje którejś z jego reguł.

## Kolejne zmiany

Po każdej zmianie strony lub aplikacji w repozytorium:

```bash
npm run build:site        # tworzy wydanie/strona-na-serwer i strona-na-serwer.zip
```

i wgraj pliki ponownie (wystarczą te, które się zmieniły; przy zmianach aplikacji – cały folder `aplikacja/`).

## Przed uruchomieniem zapisów

Formularz przedsprzedaży nie zbiera jeszcze adresów. Ustaw `FORM_ENDPOINT` na dole `landing/index.html` (np. adres formularza Formspree) i uzupełnij żółte pola w polityce prywatności i regulaminie.
