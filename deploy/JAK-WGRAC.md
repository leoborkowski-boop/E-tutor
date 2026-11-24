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
api/                      konta użytkowników (rejestracja, logowanie, synchronizacja postępów)
konto-ustawienia.php      ustawienia bazy danych kont – UZUPEŁNIJ przed wgraniem (punkt 3a)
poczta.php                wysyłka e-maili (wspólna dla zapisu i kont)
aplikacja/                aplikacja EduKwadrat (adres: twojadomena.pl/aplikacja/)
```

## 1. Włącz certyfikat SSL (https)

W panelu home.pl (panel.home.pl) otwórz ustawienia domeny i włącz bezpłatny certyfikat SSL. Zrób to **przed** wgraniem plików: `.htaccess` przekierowuje wszystkich na `https://`, a bez certyfikatu strona się nie otworzy.

## 2. Sprawdź, do którego katalogu prowadzi domena

W ustawieniach domeny w panelu jest katalog na serwerze, do którego jest przypięta (np. `/public_html` albo katalog z nazwą domeny). Tam trafią pliki.

## 3. Przygotuj zapis na przedsprzedaż

1. W panelu home.pl załóż skrzynkę e-mail w swojej domenie, np. `kontakt@twojadomena.pl`. Z niej wychodzą e-maile do zapisanych osób. Adres spoza domeny (np. Gmail) sprawi, że wiadomości trafią do spamu.
2. Sprawdź w panelu, że strona działa na PHP 8.1 lub nowszym (ustawienia serwera → wersja PHP). Konta wymagają PHP 8.1+.
3. Otwórz w Notatniku plik `zapis-ustawienia.php` i wpisz:
   - `nadawca` – adres skrzynki z punktu 1,
   - `adres_strony` – np. `https://edukwadrat.pl` (bez ukośnika na końcu),
   - `powiadomienia_na` – Twój adres, jeśli chcesz dostawać informację o każdym potwierdzonym zapisie,
   - `haslo_eksportu` – długie, losowe hasło (min. 16 znaków) do pobierania listy.
   - `smtp_haslo` – hasło do skrzynki z punktu 1, a `smtp_serwer` – adres serwera SMTP z panelu (Usługi WWW → serwer → Konta e-mail → SMTP). Dzięki temu e-maile idą przez Twoją skrzynkę, są podpisane DKIM i rzadziej trafiają do spamu. Puste = wysyłka zwykłą funkcją serwera.

   Zapisz kopię wypełnionego pliku jako `wydanie/zapis-ustawienia.php` w repozytorium (folder nie trafia do GitHuba). Wtedy `npm run build:site` będzie ją wkładać do paczki zamiast pustego wzoru.

## 3a. Przygotuj konta użytkowników (baza danych)

Konta i postępy zapisują się w bazie MySQL na Twoim hostingu. Tabele tworzą się same przy pierwszym użyciu.

1. W panelu home.pl: **Usługi WWW** → kliknij swój serwer → w polu **Bazy danych** kliknij **Utwórz**.
2. Wybierz **MySQL 8.0**, wpisz końcówkę nazwy (np. `edukwadrat`), ustaw hasło (**bez polskich znaków**) i zatwierdź. Zapisz sobie nazwę bazy i hasło.
3. Otwórz w Notatniku `konto-ustawienia.php` i wpisz:
   - `db_host` – `mysql8` (dla MySQL 8.0; dla 5.7 byłoby `localhost`),
   - `db_nazwa` – pełna nazwa bazy z panelu,
   - `db_uzytkownik` – na home.pl to ta sama nazwa co nazwa bazy,
   - `db_haslo` – hasło z punktu 2.
4. Skrzynka e-mail z punktu 3 musi działać, bo wysyłają się z niej wiadomości potwierdzające konto i zmianę hasła. Ustaw też `smtp_haslo` (punkt 3), żeby te wiadomości nie trafiały do spamu.
5. Zapisz kopię wypełnionego pliku jako `wydanie/konto-ustawienia.php` (tak jak przy `zapis-ustawienia.php`).

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
- konto: w aplikacji wejdź w **Ustawienia → Zaloguj się lub załóż konto**, załóż konto swoim adresem, kliknij link z e-maila, wpisz hasło konta i kliknij „Potwierdzam”, zaloguj się. Na drugim urządzeniu (albo w oknie prywatnym) zaloguj się tym samym kontem – postępy powinny się pojawić,
- `https://twojadomena.pl/api/biblioteka.php` – musi pokazać błąd 403 lub 404, a nie kod,
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

## Jak działają konta

- Konto jest nieobowiązkowe: aplikacja działa też bez niego, a postępy zapisują się wtedy tylko na urządzeniu.
- Po założeniu konta przychodzi e-mail z linkiem; adres potwierdza dopiero wpisanie hasła konta i kliknięcie przycisku na stronie (skanery poczty, które same otwierają linki, nie potwierdzą konta za nikogo, a nikt nie przejmie cudzego adresu, zakładając konto z własnym hasłem). Konto bez potwierdzenia znika po 7 dniach.
- Hasła są przechowywane tylko jako skróty (argon2id albo bcrypt), nigdy jawnie. Logowanie jest chronione limitami prób.
- „Nie pamiętam hasła” wysyła link ważny 1 godzinę; zmiana hasła wylogowuje wszystkie urządzenia.
- Postępy synchronizują się same (najwyżej raz na minutę) i są scalane: nic nie ginie, gdy dziecko uczyło się na dwóch urządzeniach.
- Użytkownik może sam usunąć konto razem z postępami (Konto → Usuń konto).
- Dostęp do płatnych działów (płatności) jest następnym krokiem; tabela `dostep` w bazie jest na to przygotowana.
- **Kopia zapasowa:** bazę danych pobieraj w phpMyAdmin (panel → baza → Panel → Eksportuj) co jakiś czas, a przed większymi zmianami zawsze.
