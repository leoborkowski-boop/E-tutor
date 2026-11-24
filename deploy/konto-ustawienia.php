<?php
/**
 * Ustawienia kont użytkowników. UZUPEŁNIJ przed wgraniem na serwer.
 * Ten plik nie jest dostępny z przeglądarki (blokuje go .htaccess).
 *
 * Bazę danych tworzysz w panelu home.pl (Usługi WWW → serwer → Bazy danych → Utwórz) i przepisujesz stąd
 * nazwę, użytkownika, hasło oraz adres serwera bazy. Tabele tworzą się same przy pierwszym użyciu.
 * Ustawienia poczty (nadawca, smtp_haslo, adres_strony) są w zapis-ustawienia.php.
 */
return [
    // Na home.pl: MySQL 8.0 → 'mysql8', MySQL 5.7 → 'localhost'.
    'db_host' => 'mysql8',
    // Na home.pl nazwa użytkownika bazy jest taka sama jak nazwa bazy (np. 'serwer2640600_edukwadrat').
    'db_nazwa' => '',
    'db_uzytkownik' => '',
    // Hasło ustawione przy tworzeniu bazy (home.pl: bez polskich znaków).
    'db_haslo' => '',
];
