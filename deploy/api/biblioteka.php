<?php
/**
 * EduKwadrat – konta użytkowników: biblioteka (baza danych, hasła, tokeny, limity).
 * Ten plik nie jest dostępny z przeglądarki (api/.htaccess). Punkt wejścia: index.php.
 *
 * Baza: MySQL na home.pl (w testach SQLite). Tabele tworzą się same przy pierwszym zapytaniu.
 */
declare(strict_types=1);

const WERSJA_SCHEMATU = 1;
const TOKEN_DNI = 90;            // ważność sesji (przedłuża się przy używaniu)
const MAX_TOKENOW = 10;          // ile urządzeń naraz może być zalogowanych
const POSTEPY_MAX = 1500000;     // maks. rozmiar zapisanych postępów (bajty)
const NIEPOTWIERDZONE_DNI = 7;   // po tylu dniach konto bez potwierdzenia e-maila jest usuwane
const REGULAMIN_WERSJA = '2026-11-24';   // data wersji regulaminu, którą użytkownik zaakceptował przy rejestracji

/* ---------- ustawienia ---------- */

function ustawienia(): array
{
    static $c = null;
    if ($c !== null) {
        return $c;
    }
    $root = dirname(__DIR__);
    $poczta = is_file($root . '/zapis-ustawienia.php') ? require $root . '/zapis-ustawienia.php' : [];
    $konto = is_file($root . '/konto-ustawienia.php') ? require $root . '/konto-ustawienia.php' : null;
    if (!is_array($konto)) {
        throw new KontoNieSkonfigurowane();
    }
    return $c = array_merge($poczta, $konto);
}

class KontoNieSkonfigurowane extends RuntimeException
{
}

/* ---------- baza danych ---------- */

function db(): PDO
{
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }
    $c = ustawienia();
    if (!empty($c['db_dsn'])) {
        $dsn = (string) $c['db_dsn'];
    } else {
        if (empty($c['db_nazwa']) || empty($c['db_uzytkownik'])) {
            throw new KontoNieSkonfigurowane();
        }
        $dsn = 'mysql:host=' . ($c['db_host'] ?? 'localhost') . ';dbname=' . $c['db_nazwa'] . ';charset=utf8mb4';
    }
    $pdo = new PDO($dsn, $c['db_uzytkownik'] ?? null, $c['db_haslo'] ?? null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    sqlite($pdo);
    if (sqlite()) {
        $pdo->exec('PRAGMA busy_timeout = 5000');
    } else {
        $pdo->exec("SET time_zone = '+00:00'");
    }
    migruj($pdo);
    return $pdo;
}

function sqlite(?PDO $pdo = null): bool
{
    static $s = null;
    if ($pdo !== null) {
        $s = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite';
    }
    return (bool) $s;
}

function migruj(PDO $pdo): void
{
    $lite = sqlite($pdo);
    try {
        $v = (int) $pdo->query("SELECT v FROM meta WHERE k = 'schemat'")->fetchColumn();
    } catch (Throwable $e) {
        $v = 0;
    }
    if ($v >= WERSJA_SCHEMATU) {
        return;
    }
    $pk = $lite ? 'INTEGER PRIMARY KEY AUTOINCREMENT' : 'BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY';
    $id = $lite ? 'INTEGER' : 'BIGINT UNSIGNED';
    $tekst = $lite ? 'TEXT' : 'MEDIUMTEXT';
    $opcje = $lite ? '' : ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin';
    $klucz = fn (string $nazwa, string $kol) => $lite ? '' : ", KEY $nazwa ($kol)";

    $sql = [
        "CREATE TABLE IF NOT EXISTS meta (k VARCHAR(40) NOT NULL PRIMARY KEY, v VARCHAR(255) NOT NULL)$opcje",
        "CREATE TABLE IF NOT EXISTS uzytkownicy (
            id $pk,
            email VARCHAR(254) NOT NULL UNIQUE,
            haslo_hash VARCHAR(255) NOT NULL,
            utworzono INT NOT NULL,
            zweryfikowano INT NULL,
            zgoda_ts INT NOT NULL,
            zgoda_wersja VARCHAR(20) NOT NULL,
            ostatnie_logowanie INT NULL
            " . $klucz('k_utworzono', 'utworzono') . "
        )$opcje",
        "CREATE TABLE IF NOT EXISTS tokeny (
            id $pk,
            uzytkownik_id $id NOT NULL,
            hash CHAR(64) NOT NULL UNIQUE,
            utworzono INT NOT NULL,
            ostatnie INT NOT NULL,
            wygasa INT NOT NULL,
            urzadzenie VARCHAR(80) NOT NULL DEFAULT ''
            " . $klucz('k_uzytkownik', 'uzytkownik_id') . "
        )$opcje",
        "CREATE TABLE IF NOT EXISTS kody (
            id $pk,
            uzytkownik_id $id NOT NULL,
            rodzaj VARCHAR(16) NOT NULL,
            hash CHAR(64) NOT NULL UNIQUE,
            wygasa INT NOT NULL
            " . $klucz('k_uzytkownik', 'uzytkownik_id') . "
        )$opcje",
        "CREATE TABLE IF NOT EXISTS postepy (
            uzytkownik_id $id NOT NULL PRIMARY KEY,
            dane $tekst NOT NULL,
            wersja INT NOT NULL,
            zmieniono INT NOT NULL
        )$opcje",
        "CREATE TABLE IF NOT EXISTS dostep (
            id $pk,
            uzytkownik_id $id NOT NULL,
            produkt VARCHAR(40) NOT NULL,
            do_dnia INT NOT NULL,
            zrodlo VARCHAR(40) NOT NULL,
            referencja VARCHAR(120) NOT NULL DEFAULT '',
            utworzono INT NOT NULL
            " . $klucz('k_uzytkownik', 'uzytkownik_id') . "
        )$opcje",
        "CREATE TABLE IF NOT EXISTS limity (
            klucz CHAR(64) NOT NULL PRIMARY KEY,
            okno_od INT NOT NULL,
            licznik INT NOT NULL
        )$opcje",
    ];
    foreach ($sql as $q) {
        $pdo->exec($q);
    }
    $up = $pdo->prepare("UPDATE meta SET v = ? WHERE k = 'schemat'");
    $up->execute([(string) WERSJA_SCHEMATU]);
    if ($up->rowCount() === 0) {
        try {
            $pdo->prepare("INSERT INTO meta (k, v) VALUES ('schemat', ?)")->execute([(string) WERSJA_SCHEMATU]);
        } catch (PDOException $e) {
            // równoległe pierwsze zapytanie zdążyło wpisać wersję – nic nie robimy
        }
    }
}

function w_transakcji(callable $fn)
{
    $pdo = db();
    $pdo->beginTransaction();
    try {
        $wynik = $fn($pdo);
        $pdo->commit();
        return $wynik;
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
}

function dla_aktualizacji(): string
{
    return sqlite() ? '' : ' FOR UPDATE';
}

/* ---------- limity prób ---------- */

/** Czy liczba prób w oknie została osiągnięta (bez zliczania). */
function limit_przekroczony(string $klucz, int $max, int $okno): bool
{
    $st = db()->prepare('SELECT okno_od, licznik FROM limity WHERE klucz = ?');
    $st->execute([hash('sha256', $klucz)]);
    $r = $st->fetch();
    return $r && time() - (int) $r['okno_od'] < $okno && (int) $r['licznik'] >= $max;
}

/** Zlicza próbę. */
function limit_dodaj(string $klucz, int $okno): void
{
    $k = hash('sha256', $klucz);
    for ($proba = 0; $proba < 2; $proba++) {
        try {
            w_transakcji(function (PDO $pdo) use ($k, $okno) {
                $st = $pdo->prepare('SELECT okno_od, licznik FROM limity WHERE klucz = ?' . dla_aktualizacji());
                $st->execute([$k]);
                $r = $st->fetch();
                $t = time();
                if (!$r) {
                    $pdo->prepare('INSERT INTO limity (klucz, okno_od, licznik) VALUES (?, ?, 1)')->execute([$k, $t]);
                } elseif ($t - (int) $r['okno_od'] >= $okno) {
                    $pdo->prepare('UPDATE limity SET okno_od = ?, licznik = 1 WHERE klucz = ?')->execute([$t, $k]);
                } else {
                    $pdo->prepare('UPDATE limity SET licznik = licznik + 1 WHERE klucz = ?')->execute([$k]);
                }
            });
            return;
        } catch (PDOException $e) {
            if ($proba === 1) {
                throw $e;   // dwie próby: pierwszy wpis mógł powstać równolegle
            }
        }
    }
}

/** Zlicza próbę i mówi, czy mieści się w limicie. */
function limit(string $klucz, int $max, int $okno): bool
{
    if (limit_przekroczony($klucz, $max, $okno)) {
        return false;
    }
    limit_dodaj($klucz, $okno);
    return true;
}

/* ---------- hasła ---------- */

/** Skrót hasła: argon2id (gdy dostępny) albo bcrypt. Hasło jest najpierw skracane do stałej długości,
 *  bo bcrypt ignoruje znaki po 72. bajcie. */
function haslo_wstepne(string $haslo): string
{
    return base64_encode(hash('sha256', $haslo, true));
}

function haslo_hash(string $haslo): string
{
    if (defined('PASSWORD_ARGON2ID')) {
        return password_hash(haslo_wstepne($haslo), PASSWORD_ARGON2ID, ['memory_cost' => 19456, 'time_cost' => 2, 'threads' => 1]);
    }
    return password_hash(haslo_wstepne($haslo), PASSWORD_BCRYPT, ['cost' => 11]);
}

function haslo_ok(string $haslo, string $hash): bool
{
    return password_verify(haslo_wstepne($haslo), $hash);
}

/** Zwraca komunikat błędu albo null, gdy hasło jest wystarczająco dobre. */
function haslo_blad(string $haslo, string $email): ?string
{
    $dl = mb_strlen($haslo);
    if ($dl < 8) {
        return 'Hasło musi mieć co najmniej 8 znaków.';
    }
    if ($dl > 200) {
        return 'Hasło jest za długie (najwyżej 200 znaków).';
    }
    $l = mb_strtolower($haslo);
    $slabe = ['12345678', '123456789', '1234567890', 'qwertyui', 'qwertyuiop', 'password', 'haslo123', 'haslo1234', 'matematyka',
        'edukwadrat', 'edukwadrat1', 'zaq12wsx', '11111111', 'abcd1234', 'qwerty123', 'polska123', 'kocham cie', 'iloveyou'];
    if (in_array($l, $slabe, true) || $l === $email || preg_match('/^(.)\1+$/u', $haslo)) {
        return 'To hasło jest zbyt łatwe do odgadnięcia. Wybierz inne.';
    }
    return null;
}

/** Gotowy fikcyjny skrót (tych samych parametrów co prawdziwe) do wyrównania czasu odpowiedzi, gdy konta nie ma –
 *  dzięki temu po czasie odpowiedzi nie da się odgadnąć, czy adres ma konto. */
function haslo_atrapa(): string
{
    return defined('PASSWORD_ARGON2ID')
        ? '$argon2id$v=19$m=19456,t=2,p=1$cHd6UjQ2MFRDei5OVWdIOQ$bf2bpf+f5xeY6X5g/PEMISSubSb4MwRaazmFp6evqy8'
        : '$2y$11$Np2g4T1dtmcRkysJjoifwOOLWYL2EhF1KRjs6ft8uw.PKuze9OVly';
}

/* ---------- sesje (tokeny) i kody jednorazowe ---------- */

function los(): string
{
    return bin2hex(random_bytes(32));
}

function token_utworz(int $uid, string $urzadzenie): string
{
    $token = los();
    $t = time();
    w_transakcji(function (PDO $pdo) use ($uid, $token, $t, $urzadzenie) {
        $pdo->prepare('INSERT INTO tokeny (uzytkownik_id, hash, utworzono, ostatnie, wygasa, urzadzenie) VALUES (?, ?, ?, ?, ?, ?)')
            ->execute([$uid, hash('sha256', $token), $t, $t, $t + TOKEN_DNI * 86400, mb_substr($urzadzenie, 0, 80)]);
        // zostaje najwyżej MAX_TOKENOW najnowszych sesji
        $st = $pdo->prepare('SELECT id FROM tokeny WHERE uzytkownik_id = ? ORDER BY ostatnie DESC, id DESC');
        $st->execute([$uid]);
        $ids = array_column($st->fetchAll(), 'id');
        foreach (array_slice($ids, MAX_TOKENOW) as $stary) {
            $pdo->prepare('DELETE FROM tokeny WHERE id = ?')->execute([$stary]);
        }
    });
    return $token;
}

/** Zwraca wiersz użytkownika (z polem token_id) albo null, gdy token jest nieprawidłowy lub wygasł. */
function uzytkownik_z_tokenu(?string $token): ?array
{
    if (!$token || !preg_match('/^[a-f0-9]{64}$/', $token)) {
        return null;
    }
    $st = db()->prepare('SELECT u.*, t.id AS token_id, t.ostatnie AS token_ostatnie
        FROM tokeny t JOIN uzytkownicy u ON u.id = t.uzytkownik_id WHERE t.hash = ? AND t.wygasa > ?');
    $st->execute([hash('sha256', $token), time()]);
    $u = $st->fetch();
    if (!$u) {
        return null;
    }
    if (time() - (int) $u['token_ostatnie'] > 86400) {   // przedłużamy sesję najwyżej raz na dobę
        db()->prepare('UPDATE tokeny SET ostatnie = ?, wygasa = ? WHERE id = ?')
            ->execute([time(), time() + TOKEN_DNI * 86400, $u['token_id']]);
    }
    return $u;
}

function tokeny_usun_uzytkownika(int $uid, ?int $zostaw = null): void
{
    if ($zostaw === null) {
        db()->prepare('DELETE FROM tokeny WHERE uzytkownik_id = ?')->execute([$uid]);
    } else {
        db()->prepare('DELETE FROM tokeny WHERE uzytkownik_id = ? AND id <> ?')->execute([$uid, $zostaw]);
    }
}

/** Tworzy jednorazowy kod (np. potwierdzenie e-maila, reset hasła); poprzedni kod tego rodzaju przestaje działać. */
function kod_utworz(int $uid, string $rodzaj, int $sekundy): string
{
    $kod = los();
    w_transakcji(function (PDO $pdo) use ($uid, $rodzaj, $kod, $sekundy) {
        $pdo->prepare('DELETE FROM kody WHERE uzytkownik_id = ? AND rodzaj = ?')->execute([$uid, $rodzaj]);
        $pdo->prepare('INSERT INTO kody (uzytkownik_id, rodzaj, hash, wygasa) VALUES (?, ?, ?, ?)')
            ->execute([$uid, $rodzaj, hash('sha256', $kod), time() + $sekundy]);
    });
    return $kod;
}

function kod_sprawdz(string $kod, string $rodzaj): ?array
{
    if (!preg_match('/^[a-f0-9]{64}$/', $kod)) {
        return null;
    }
    $st = db()->prepare('SELECT * FROM kody WHERE hash = ? AND rodzaj = ? AND wygasa > ?');
    $st->execute([hash('sha256', $kod), $rodzaj, time()]);
    return $st->fetch() ?: null;
}

/* ---------- sprzątanie i usuwanie ---------- */

function sprzatanie(): void
{
    $pdo = db();
    $t = time();
    $pdo->prepare('DELETE FROM tokeny WHERE wygasa <= ?')->execute([$t]);
    $pdo->prepare('DELETE FROM kody WHERE wygasa <= ?')->execute([$t]);
    $pdo->prepare('DELETE FROM limity WHERE okno_od < ?')->execute([$t - 2 * 86400]);
    // konta, których właściciel nie potwierdził adresu e-mail
    $st = $pdo->prepare('SELECT id FROM uzytkownicy WHERE zweryfikowano IS NULL AND utworzono < ?');
    $st->execute([$t - NIEPOTWIERDZONE_DNI * 86400]);
    foreach (array_column($st->fetchAll(), 'id') as $uid) {
        konto_usun((int) $uid);
    }
}

function konto_usun(int $uid): void
{
    w_transakcji(function (PDO $pdo) use ($uid) {
        foreach (['tokeny', 'kody', 'postepy', 'dostep'] as $tabela) {
            $pdo->prepare("DELETE FROM $tabela WHERE uzytkownik_id = ?")->execute([$uid]);
        }
        $pdo->prepare('DELETE FROM uzytkownicy WHERE id = ?')->execute([$uid]);
    });
}

/* ---------- uprawnienia do płatnych lekcji (wypełniane po podłączeniu płatności) ---------- */

function dostep_aktywny(int $uid): array
{
    $st = db()->prepare('SELECT produkt, do_dnia FROM dostep WHERE uzytkownik_id = ? AND do_dnia > ?');
    $st->execute([$uid, time()]);
    return array_map(fn ($r) => ['produkt' => $r['produkt'], 'do' => (int) $r['do_dnia']], $st->fetchAll());
}

/* ---------- użytkownicy ---------- */

function uzytkownik_po_emailu(string $email): ?array
{
    $st = db()->prepare('SELECT * FROM uzytkownicy WHERE email = ?');
    $st->execute([$email]);
    return $st->fetch() ?: null;
}

function normalizuj_email(string $email): string
{
    return strtolower(trim($email));
}

function email_poprawny(string $email): bool
{
    return strlen($email) <= 254 && filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}
