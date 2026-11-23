# Jak wgrać EduKwadrat na home.pl

Paczka `strona-na-serwer.zip` zawiera wszystko, co ma trafić na serwer:

```
.htaccess                 ustawienia serwera (https, bezpieczeństwo, pamięć podręczna)
index.html                strona sprzedażowa
polityka-prywatnosci.html
regulamin.html
legal.css, fonts/, img/   wygląd, czcionki, zrzuty ekranu
robots.txt
zapis.php                 zapis na przedsprzedaż (potwierdzenie e-mailem, wypisanie, eksport)
zapis-ustawienia.php      ustawienia zapisu – UZUPEŁNIJ przed wgraniem (punkt 3)
dane/                     tu serwer zapisuje adresy; zablokowany dla przeglądarki
aplikacja/                aplikacja EduKwadrat (adres: twojadomena.pl/aplikacja/)
```

## 1. Włącz certyfikat SSL (https)

W panelu home.pl (panel.home.pl) otwórz ustawienia domeny i włącz bezpłatny certyfikat SSL. Zrób to **przed** wgraniem plików: `.htaccess` przekierowuje wszystkich na `https://`, a bez certyfikatu strona się nie otworzy.

## 2. Sprawdź, do którego katalogu prowadzi domena

W ustawieniach domeny w panelu jest katalog na serwerze, do którego jest przypięta (np. `/public_html` albo katalog z nazwą domeny). Tam trafią pliki.

## 3. Przygotuj zapis na przedsprzedaż

1. W panelu home.pl załóż skrzynkę e-mail w swojej domenie, np. `kontakt@twojadomena.pl`. Z niej wychodzą e-maile do zapisanych osób. Adres spoza domeny (np. Gmail) sprawi, że wiadomości trafią do spamu.
2. Sprawdź w panelu, że strona działa na PHP 8 (ustawienia serwera → wersja PHP). Wystarczy też PHP 7.4.
3. Otwórz w Notatniku plik `zapis-ustawienia.php` i wpisz:
   - `nadawca` – adres skrzynki z punktu 1,
   - `adres_strony` – np. `https://edukwadrat.pl` (bez ukośnika na końcu),
   - `powiadomienia_na` – Twój adres, jeśli chcesz dostawać informację o każdym potwierdzonym zapisie,
   - `haslo_eksportu` – długie, losowe hasło (min. 16 znaków) do pobierania listy.
   - `smtp_haslo` – hasło do skrzynki z punktu 1, a `smtp_serwer` – adres serwera SMTP z panelu (Usługi WWW → serwer → Konta e-mail → SMTP). Dzięki temu e-maile idą przez Twoją skrzynkę, są podpisane DKIM i rzadziej trafiają do spamu. Puste = wysyłka zwykłą funkcją serwera.

   Zapisz kopię wypełnionego pliku jako `wydanie/zapis-ustawienia.php` w repozytorium (folder nie trafia do GitHuba). Wtedy `npm run build:site` będzie ją wkładać do paczki zamiast pustego wzoru.

## 4. Wgraj pliki

Rozpakuj `strona-na-serwer.zip` na komputerze. Wgraj **zawartość** folderu `strona-na-serwer` (nie sam folder) do katalogu domeny. Do wyboru:

- **Menedżer plików / WebFTP w panelu home.pl:** wybierz katalog domeny i wyślij pliki oraz foldery.
- **Program FTP (np. FileZilla):** dane do połączenia (serwer, login, hasło) są w panelu home.pl w ustawieniach FTP usługi hostingowej.

Plik `.htaccess` zaczyna się od kropki, więc na Macu i w niektórych programach jest ukryty. Upewnij się, że też został wgrany (w FileZilli: Serwer → Wymuś pokazywanie ukrytych plików).

Jeśli w katalogu domeny są stare pliki (np. strona startowa home.pl `index.html`), zastąp je.

## 5. Sprawdź

- `https://twojadomena.pl` – strona sprzedażowa, na dole komunikat o cookies,
- przycisk „Wypróbuj ułamki” – otwiera `https://twojadomena.pl/aplikacja/`,
- `https://twojadomena.pl/polityka-prywatnosci.html` i `/regulamin.html`,
- zapis: wpisz swój adres w formularzu, kliknij link z e-maila (sprawdź też spam) – powinna się pokazać strona „Zapis potwierdzony”,
- `https://twojadomena.pl/dane/zapisy.php` – musi pokazać błąd 404 albo pustą stronę, a **nie** listę adresów,
- `https://twojadomena.pl/zapis.php?eksport` – po wpisaniu hasła pobiera się plik CSV z Twoim adresem.

Jeśli zamiast strony widać błąd 500, usuń z serwera plik `.htaccess` i napisz, co się stało – to znaczy, że serwer nie obsługuje którejś z jego reguł.

## Kolejne zmiany

Po każdej zmianie strony lub aplikacji w repozytorium:

```bash
npm run build:site        # tworzy wydanie/strona-na-serwer i strona-na-serwer.zip
```

i wgraj pliki ponownie (wystarczą te, które się zmieniły; przy zmianach aplikacji – cały folder `aplikacja/`). **Nie usuwaj na serwerze folderu `dane/`** – są w nim zapisane adresy. Nie nadpisuj też wypełnionego `zapis-ustawienia.php` pustym wzorem.

## Jak działa zapis

- Ktoś wpisuje adres → dostaje e-mail z linkiem potwierdzającym. Link otwiera stronę z przyciskiem „Potwierdzam zapis”; dopiero kliknięcie przycisku dopisuje adres do listy (skanery poczty, które same otwierają linki, nie potwierdzą zapisu za kogoś). Dzięki temu nikt nie zapisze cudzego adresu, a Ty masz dowód zgody (data i IP potwierdzenia).
- Niepotwierdzone adresy znikają po 7 dniach, wszystkie – po dacie `usun_po` (31 maja 2027, tak jak w polityce prywatności).
- Każdy e-mail ma link do wypisania; kliknięcie od razu usuwa adres.
- Lista: `zapis.php?eksport` → hasło → plik CSV (otwiera się w Excelu). W ostatniej kolumnie jest osobisty link do wypisania – wklej go do e-maila startowego dla każdej osoby.
- Ochrona przed spamem: ukryte pole-pułapka na boty, limit 5 prób na godzinę z jednego adresu IP, najwyżej 3 linki na dobę na ten sam adres e-mail i najwyżej 50 e-maili na godzinę w sumie (`limit_maili_na_godzine`).
- Eksport: 10 prób hasła na godzinę z jednego adresu IP.

## Przed uruchomieniem

Uzupełnij żółte pola `[UZUPEŁNIJ…]` w polityce prywatności i regulaminie (dane właściciela, adres kontaktowy, okres przechowywania dzienników serwera – zapytaj home.pl).
