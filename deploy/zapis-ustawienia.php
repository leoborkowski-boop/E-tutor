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
];
