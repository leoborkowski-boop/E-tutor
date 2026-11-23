<?php
/**
 * Ustawienia zapisu na przedsprzedaż. UZUPEŁNIJ przed wgraniem na serwer.
 * Ten plik nie jest dostępny z przeglądarki (blokuje go .htaccess).
 */
return [
    // Adres, z którego idą e-maile. Musi istnieć w Twojej domenie na home.pl (utwórz skrzynkę w panelu),
    // inaczej wiadomości mogą trafiać do spamu albo nie dochodzić.
    'nadawca' => 'kontakt@twojadomena.pl',
    'nadawca_nazwa' => 'EduKwadrat',

    // Wysyłka przez skrzynkę nadawcy (zalecane – e-maile rzadziej trafiają do spamu).
    // smtp_haslo: hasło do skrzynki z pola 'nadawca'. Puste = wysyłka funkcją mail() serwera.
    // smtp_serwer: adres serwera SMTP z panelu home.pl (Usługi WWW → serwer → Konta e-mail → SMTP).
    'smtp_serwer' => 'serwerXXXXXXX.hosting-home.pl',
    'smtp_port' => 465,
    'smtp_haslo' => '',

    // Pełny adres strony z https, bez ukośnika na końcu (do linków w e-mailach).
    'adres_strony' => 'https://twojadomena.pl',

    // Na ten adres przyjdzie krótka informacja o każdym potwierdzonym zapisie. Pusty = bez powiadomień.
    'powiadomienia_na' => '',

    // Hasło do pobrania listy potwierdzonych adresów: https://twojadomena.pl/zapis.php?eksport
    // Ustaw długie, losowe hasło (min. 16 znaków). Puste = eksport wyłączony.
    'haslo_eksportu' => '',

    // Do kiedy przechowujemy adresy (zgodnie z polityką prywatności). Po tej dacie są usuwane automatycznie.
    'usun_po' => '2027-05-31',

    // Ile prób zapisu na godzinę z jednego adresu IP.
    'limit_na_godzine' => 5,

    // Ile e-maili potwierdzających serwer może wysłać łącznie w ciągu godziny
    // (chroni domenę przed trafieniem na listy spamu, gdyby ktoś zasypywał formularz).
    'limit_maili_na_godzine' => 50,
];
