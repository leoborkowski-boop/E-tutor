<?php
/**
 * EduKwadrat – zapis na przedsprzedaż (PHP 7.4+, bez bazy danych).
 *
 *   POST zapis.php                  zapis: {email, topic, consent, strona(pułapka)} → JSON
 *   GET  zapis.php?potwierdz=TOKEN  strona z przyciskiem „Potwierdzam” (link z e-maila)
 *   GET  zapis.php?wypisz=TOKEN     strona z przyciskiem „Wypisz mnie”
 *   POST zapis.php?potwierdz|wypisz wykonanie (token w polu formularza)
 *   GET  zapis.php?eksport          formularz hasła → lista potwierdzonych adresów (CSV)
 *
 * Potwierdzenie i wypisanie wymagają kliknięcia przycisku, bo skanery poczty
 * (np. w firmowych skrzynkach) same otwierają linki z e-maili.
 *
 * Dane: katalog dane/. Pliki mają rozszerzenie .php i zaczynają się od „<?php exit; ?>”,
 * więc nawet gdyby serwer zignorował dane/.htaccess, przeglądarka nie zobaczy adresów.
 */
declare(strict_types=1);

ini_set('display_errors', '0');
ini_set('log_errors', '1');

$cfg = require __DIR__ . '/zapis-ustawienia.php';
$DIR = __DIR__ . '/dane';
$PLIK = $DIR . '/zapisy.php';
$LIMITY = $DIR . '/limity.php';
const TEMATY = ['', 'Ułamki', 'Procenty', 'Równania i wyrażenia', 'Geometria', 'Zadania tekstowe', 'Wszystko po trochu'];
const OCZEKUJE_DNI = 7;
const STRAZNIK = "<?php exit; ?>\n";

naglowki_bezpieczenstwa();

if (!is_dir($DIR)) {
    mkdir($DIR, 0700, true);
}
if (!file_exists($DIR . '/.htaccess')) {
    file_put_contents($DIR . '/.htaccess', "Require all denied\n<IfModule !mod_authz_core.c>\nDeny from all\n</IfModule>\n");
}
if (!filter_var($cfg['nadawca'] ?? '', FILTER_VALIDATE_EMAIL)) {
    error_log('EduKwadrat zapis: niepoprawny adres nadawcy w zapis-ustawienia.php');
}

/* ---------- pomocnicze ---------- */

function naglowki_bezpieczenstwa(): void
{
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    // linki zawierają tokeny – nie przekazujemy adresu strony dalej
    header('Referrer-Policy: no-referrer');
    header('X-Robots-Tag: noindex, nofollow');
    header("Content-Security-Policy: default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; form-action 'self'; frame-ancestors 'none'; base-uri 'none'; object-src 'none'");
    header('Cache-Control: no-store');
}

/** Odczyt i zapis pliku danych pod blokadą – bezpieczne przy jednoczesnych zapisach. */
function zmien_plik(string $plik, callable $fn)
{
    $nowy = !file_exists($plik);
    $h = fopen($plik, 'c+');
    if (!$h) {
        throw new RuntimeException('Brak dostępu do pliku danych.');
    }
    if ($nowy) {
        @chmod($plik, 0600);
    }
    flock($h, LOCK_EX);
    $tresc = (string) stream_get_contents($h);
    if (strpos($tresc, STRAZNIK) === 0) {
        $tresc = substr($tresc, strlen(STRAZNIK));
    }
    $dane = $tresc !== '' ? (json_decode($tresc, true) ?: []) : [];
    $wynik = $fn($dane);
    ftruncate($h, 0);
    rewind($h);
    fwrite($h, STRAZNIK . json_encode($dane, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    fflush($h);
    flock($h, LOCK_UN);
    fclose($h);
    return $wynik;
}

/**
 * Licznik prób w oknie czasowym. Zwraca true i zlicza próbę, gdy limit nie jest przekroczony.
 * Klucze to skróty (hash), więc w pliku nie ma adresów IP ani e-mail wprost.
 */
function w_limicie(string $plik, string $klucz, int $limit, int $okno): bool
{
    return zmien_plik($plik, function (array &$l) use ($klucz, $limit, $okno) {
        $teraz = time();
        foreach ($l as $k => $wpis) {
            $l[$k]['t'] = array_values(array_filter($wpis['t'], fn ($t) => $t > $teraz - $wpis['o']));
            if (!$l[$k]['t']) {
                unset($l[$k]);
            }
        }
        $k = hash('sha256', $klucz);
        if (count($l[$k]['t'] ?? []) >= $limit) {
            return false;
        }
        $l[$k]['o'] = $okno;
        $l[$k]['t'][] = $teraz;
        return true;
    });
}

/** Adres IP klienta. Za serwerem pośredniczącym hostingu (adres prywatny) bierze adres z X-Forwarded-For. */
function ip_klienta(): string
{
    $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
    $publiczny = fn ($a) => (bool) filter_var($a, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE);
    if (!$publiczny($ip) && !empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $lista = array_reverse(array_map('trim', explode(',', (string) $_SERVER['HTTP_X_FORWARDED_FOR'])));
        foreach ($lista as $a) {
            if ($publiczny($a)) {
                return $a;
            }
        }
    }
    return $ip;
}

/** Usuwa dane po terminie z polityki prywatności i niepotwierdzone zapisy starsze niż 7 dni. */
function sprzataj(array &$zapisy, array $cfg): void
{
    if (date('Y-m-d') > $cfg['usun_po']) {
        $zapisy = [];
        return;
    }
    $granica = time() - OCZEKUJE_DNI * 86400;
    foreach ($zapisy as $email => $z) {
        if ($z['status'] === 'oczekuje' && $z['zapis_ts'] < $granica) {
            unset($zapisy[$email]);
        }
    }
}

function json_odp(int $kod, array $dane): void
{
    http_response_code($kod);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($dane, JSON_UNESCAPED_UNICODE);
    exit;
}

function e(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
}

/** Prosta strona HTML. $html – dodatkowa treść (już bezpieczna), np. formularz. */
function strona_odp(string $tytul, string $tekst, array $cfg, int $kod = 200, string $html = ''): void
{
    http_response_code($kod);
    header('Content-Type: text/html; charset=utf-8');
    $t = e($tytul);
    $x = e($tekst);
    $u = e(rtrim($cfg['adres_strony'], '/'));
    echo <<<HTML
<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><meta name="referrer" content="no-referrer">
<title>$t · EduKwadrat</title><link rel="stylesheet" href="fonts/fonts.css"><link rel="stylesheet" href="legal.css"></head>
<body><header class="top"><div class="wrap"><a href="$u/">EduKwadrat</a></div></header>
<main class="wrap"><h1>$t</h1><p>$x</p>$html<p><a href="$u/">Wróć na stronę EduKwadrat</a></p></main></body></html>
HTML;
    exit;
}

function przycisk(string $akcja, string $token, string $etykieta): string
{
    return '<form method="post" action="zapis.php?' . e($akcja) . '"><input type="hidden" name="token" value="' . e($token) . '">'
        . '<p><button type="submit" style="font:inherit;font-weight:600;padding:.6em 1.2em;cursor:pointer">' . e($etykieta) . '</button></p></form>';
}

function wyslij(string $do, string $temat, string $tresc, array $cfg): bool
{
    // Tryb testowy: e-maile zapisywane do plików zamiast wysyłki
    $test = getenv('EDUKWADRAT_TEST_MAIL_DIR');
    if ($test) {
        return (bool) file_put_contents($test . '/' . microtime(true) . '.txt', "Do: $do\nTemat: $temat\n\n$tresc");
    }
    $nadawca = (string) $cfg['nadawca'];
    if (!filter_var($nadawca, FILTER_VALIDATE_EMAIL) || !filter_var($do, FILTER_VALIDATE_EMAIL)) {
        return false;
    }
    $naglowki = implode("\r\n", [
        'From: =?UTF-8?B?' . base64_encode((string) $cfg['nadawca_nazwa']) . "?= <$nadawca>",
        "Reply-To: $nadawca",
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
        'Auto-Submitted: auto-generated',
    ]);
    return mail($do, '=?UTF-8?B?' . base64_encode($temat) . '?=', $tresc, $naglowki, '-f' . $nadawca);
}

function link_do(array $cfg, string $param, string $token): string
{
    return rtrim($cfg['adres_strony'], '/') . '/zapis.php?' . $param . '=' . $token;
}

/** Komórka CSV bez ryzyka formuł w Excelu (=, +, -, @ na początku). */
function csv_bezp(string $v): string
{
    return preg_match('/^[=+\-@\t\r]/', $v) ? "'" . $v : $v;
}

function token_z(string $s): string
{
    $t = preg_replace('/[^a-f0-9]/', '', $s);
    return strlen($t) === 32 ? $t : '';
}

$ip = ip_klienta();
$post = ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST';

// Każde żądanie POST tylko z naszej strony (ochrona przed wysyłaniem formularzy z obcych witryn)
if ($post) {
    $origin = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
    $host = strtolower((string) preg_replace('/:\d+$/', '', (string) ($_SERVER['HTTP_HOST'] ?? '')));
    if ($origin !== '' && strtolower((string) parse_url($origin, PHP_URL_HOST)) !== $host) {
        json_odp(403, ['ok' => false, 'wiadomosc' => 'Zapis możliwy tylko ze strony EduKwadrat.']);
    }
}

/* ---------- potwierdzenie ---------- */

if (isset($_GET['potwierdz'])) {
    if (!$post) {
        $token = token_z((string) $_GET['potwierdz']);
        if ($token === '') {
            strona_odp('Link wygasł', 'Ten link jest niepełny albo nieaktualny. Zapisz się ponownie na stronie – wyślemy nowy link.', $cfg, 404);
        }
        strona_odp('Potwierdź zapis', 'Kliknij przycisk, żeby potwierdzić zapis na przedsprzedaż EduKwadrat.', $cfg, 200, przycisk('potwierdz', $token, 'Potwierdzam zapis'));
    }
    $token = token_z((string) ($_POST['token'] ?? ''));
    $wynik = zmien_plik($PLIK, function (array &$zapisy) use ($token, $ip, $cfg) {
        sprzataj($zapisy, $cfg);
        foreach ($zapisy as $email => $z) {
            if ($token !== '' && hash_equals($z['token'], $token)) {
                $nowy = $z['status'] !== 'potwierdzony';
                $zapisy[$email]['status'] = 'potwierdzony';
                $zapisy[$email]['potwierdzenie_ts'] = $z['potwierdzenie_ts'] ?? time();
                $zapisy[$email]['potwierdzenie_ip'] = $z['potwierdzenie_ip'] ?? $ip;
                return ['email' => (string) $email, 'nowy' => $nowy, 'temat' => $z['temat']];
            }
        }
        return null;
    });
    if (!$wynik) {
        strona_odp('Link wygasł', 'Ten link jest nieaktualny. Zapisz się ponownie na stronie – wyślemy nowy link.', $cfg, 404);
    }
    if ($wynik['nowy'] && $cfg['powiadomienia_na']) {
        wyslij((string) $cfg['powiadomienia_na'], 'Nowy zapis na przedsprzedaż', "Adres: {$wynik['email']}\nTemat: " . ($wynik['temat'] ?: '–') . "\nData: " . date('Y-m-d H:i'), $cfg);
    }
    strona_odp('Zapis potwierdzony', 'Dziękujemy. Gdy ruszy pełna wersja EduKwadrat, wyślemy jeden e-mail z linkiem do zakupu w cenie 99 zł.', $cfg);
}

/* ---------- wypisanie ---------- */

if (isset($_GET['wypisz'])) {
    if (!$post) {
        $token = token_z((string) $_GET['wypisz']);
        if ($token === '') {
            strona_odp('Link nieaktualny', 'Ten link jest niepełny. Napisz do nas, a usuniemy adres ręcznie.', $cfg, 404);
        }
        strona_odp('Wypisz się', 'Kliknij przycisk, żeby usunąć swój adres z listy EduKwadrat.', $cfg, 200, przycisk('wypisz', $token, 'Wypisz mnie'));
    }
    $token = token_z((string) ($_POST['token'] ?? ''));
    zmien_plik($PLIK, function (array &$zapisy) use ($token) {
        foreach ($zapisy as $email => $z) {
            if ($token !== '' && hash_equals($z['token'], $token)) {
                unset($zapisy[$email]);
            }
        }
    });
    // Ta sama odpowiedź, gdy adresu nie było – nie zdradzamy, czy był na liście
    strona_odp('Wypisano', 'Twojego adresu nie ma na liście. Nie wyślemy już żadnej wiadomości.', $cfg);
}

/* ---------- eksport ---------- */

if (isset($_GET['eksport'])) {
    $haslo = (string) $cfg['haslo_eksportu'];
    $podane = (string) ($_POST['haslo'] ?? '');
    $formularz = '<form method="post" action="zapis.php?eksport"><p><label for="haslo">Hasło eksportu</label><br>'
        . '<input id="haslo" name="haslo" type="password" autocomplete="current-password" required style="font:inherit;padding:.5em;min-width:16em"></p>'
        . '<p><button type="submit" style="font:inherit;padding:.5em 1em">Pobierz listę (CSV)</button></p></form>';
    if (strlen($haslo) < 16) {
        strona_odp('Eksport wyłączony', 'Ustaw hasło eksportu (co najmniej 16 znaków) w pliku zapis-ustawienia.php.', $cfg, 403);
    }
    if (!$post) {
        strona_odp('Eksport zapisów', 'Podaj hasło z pliku zapis-ustawienia.php.', $cfg, 200, $formularz);
    }
    // 10 prób na godzinę z jednego adresu IP – zgadywanie hasła nie ma sensu
    if (!w_limicie($LIMITY, 'eksport:' . $ip, 10, 3600)) {
        strona_odp('Za dużo prób', 'Spróbuj ponownie za godzinę.', $cfg, 429);
    }
    if (!hash_equals($haslo, $podane)) {
        strona_odp('Nieprawidłowe hasło', 'Sprawdź hasło w pliku zapis-ustawienia.php.', $cfg, 403, $formularz);
    }
    $zapisy = zmien_plik($PLIK, function (array &$zapisy) use ($cfg) {
        sprzataj($zapisy, $cfg);
        return $zapisy;
    });
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="edukwadrat-zapisy-' . date('Y-m-d') . '.csv"');
    $out = fopen('php://output', 'w');
    fwrite($out, "\xEF\xBB\xBF"); // BOM – polskie znaki w Excelu
    fputcsv($out, ['email', 'temat', 'zapis', 'potwierdzenie', 'ip_potwierdzenia', 'link_wypisania'], ';');
    foreach ($zapisy as $email => $z) {
        if ($z['status'] !== 'potwierdzony') {
            continue;
        }
        fputcsv($out, array_map('csv_bezp', [(string) $email, $z['temat'], date('Y-m-d H:i', $z['zapis_ts']), date('Y-m-d H:i', $z['potwierdzenie_ts']), $z['potwierdzenie_ip'], link_do($cfg, 'wypisz', $z['token'])]), ';');
    }
    exit;
}

/* ---------- zapis ---------- */

if (!$post) {
    json_odp(405, ['ok' => false, 'wiadomosc' => 'Nieobsługiwane zapytanie.']);
}

$surowe = (string) file_get_contents('php://input', false, null, 0, 4096);
$wejscie = json_decode($surowe, true);
if (!is_array($wejscie)) {
    $wejscie = $_POST;
}
$email = strtolower(trim((string) ($wejscie['email'] ?? '')));
$temat = (string) ($wejscie['topic'] ?? '');
$zgoda = !empty($wejscie['consent']);
$pulapka = trim((string) ($wejscie['strona'] ?? ''));

$OK = ['ok' => true, 'wiadomosc' => 'Sprawdź skrzynkę: wysłaliśmy link potwierdzający zapis. Jeśli go nie widzisz, zajrzyj do spamu.'];

if ($pulapka !== '') {
    json_odp(200, $OK); // automat – udajemy sukces, nic nie zapisujemy
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 254) {
    json_odp(400, ['ok' => false, 'wiadomosc' => 'Wpisz poprawny adres e-mail, np. imie@przyklad.pl.']);
}
if (!$zgoda) {
    json_odp(400, ['ok' => false, 'wiadomosc' => 'Zaznacz zgodę, żebyśmy mogli wysłać Ci e-mail na start.']);
}
if (!in_array($temat, TEMATY, true)) {
    $temat = '';
}

// Limit prób z jednego adresu IP
if (!w_limicie($LIMITY, 'zapis:' . $ip, (int) $cfg['limit_na_godzine'], 3600)) {
    json_odp(429, ['ok' => false, 'wiadomosc' => 'Za dużo prób w krótkim czasie. Spróbuj ponownie za godzinę.']);
}

// Zapis albo ponowne wysłanie linku (bez zdradzania, czy adres już jest na liście)
$doWyslania = zmien_plik($PLIK, function (array &$zapisy) use ($email, $temat, $ip, $cfg) {
    sprzataj($zapisy, $cfg);
    if (isset($zapisy[$email]) && $zapisy[$email]['status'] === 'potwierdzony') {
        return null;
    }
    $token = $zapisy[$email]['token'] ?? bin2hex(random_bytes(16));
    $zapisy[$email] = [
        'status' => 'oczekuje',
        'temat' => $temat,
        'token' => $token,
        'zapis_ts' => $zapisy[$email]['zapis_ts'] ?? time(),
        'zapis_ip' => $ip,
        'zrodlo' => 'strona – przedsprzedaż',
    ];
    return $token;
});

// Ochrona przed zasypywaniem cudzej skrzynki: najwyżej 3 linki na adres na dobę (po cichu, bez komunikatu)
if ($doWyslania && !w_limicie($LIMITY, 'adres:' . $email, 3, 86400)) {
    $doWyslania = null;
}
// Ochrona dobrego imienia domeny i limitów home.pl: łączna liczba e-maili na godzinę
if ($doWyslania && !w_limicie($LIMITY, 'wszystkie-maile', (int) ($cfg['limit_maili_na_godzine'] ?? 50), 3600)) {
    json_odp(503, ['ok' => false, 'wiadomosc' => 'Mamy teraz bardzo dużo zapisów. Spróbuj ponownie za godzinę.']);
}

if ($doWyslania) {
    $tresc = "Dzień dobry,\n\n"
        . "ktoś (prawdopodobnie Ty) zapisał ten adres na przedsprzedaż EduKwadrat – aplikacji do nauki matematyki przed egzaminem ósmoklasisty.\n\n"
        . "Aby potwierdzić zapis, otwórz link i kliknij „Potwierdzam zapis”:\n" . link_do($cfg, 'potwierdz', $doWyslania) . "\n\n"
        . "Po potwierdzeniu wyślemy jeden e-mail, gdy ruszy pełna wersja, z linkiem do zakupu w cenie 99 zł. Bez newslettera.\n\n"
        . "Jeśli to nie Ty, zignoruj tę wiadomość – adres zostanie usunięty po 7 dniach.\n"
        . "Rezygnacja w każdej chwili: " . link_do($cfg, 'wypisz', $doWyslania) . "\n\n"
        . "EduKwadrat – nauka do kwadratu\n"
        . rtrim($cfg['adres_strony'], '/') . "/polityka-prywatnosci.html\n";
    if (!wyslij($email, 'Potwierdź zapis na przedsprzedaż EduKwadrat', $tresc, $cfg)) {
        json_odp(500, ['ok' => false, 'wiadomosc' => 'Nie udało się wysłać e-maila potwierdzającego. Spróbuj ponownie za kilka minut.']);
    }
}

json_odp(200, $OK);
