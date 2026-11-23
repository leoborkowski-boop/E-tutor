<?php
/**
 * EduKwadrat – zapis na przedsprzedaż (PHP 7.4+, bez bazy danych).
 *
 *   POST zapis.php                 zapis: {email, topic, consent, strona(pułapka)} → JSON
 *   GET  zapis.php?potwierdz=TOKEN potwierdzenie adresu (link z e-maila)
 *   GET  zapis.php?wypisz=TOKEN    wypisanie i usunięcie adresu
 *   GET  zapis.php?eksport         formularz hasła → lista potwierdzonych adresów (CSV)
 *
 * Dane: katalog dane/ (zablokowany dla przeglądarki przez dane/.htaccess).
 */
declare(strict_types=1);

$cfg = require __DIR__ . '/zapis-ustawienia.php';
$DIR = __DIR__ . '/dane';
$PLIK = $DIR . '/zapisy.json';
$LIMITY = $DIR . '/limity.json';
const TEMATY = ['', 'Ułamki', 'Procenty', 'Równania i wyrażenia', 'Geometria', 'Zadania tekstowe', 'Wszystko po trochu'];
const OCZEKUJE_DNI = 7;

if (!is_dir($DIR)) {
    mkdir($DIR, 0750, true);
}
if (!file_exists($DIR . '/.htaccess')) {
    file_put_contents($DIR . '/.htaccess', "Require all denied\n<IfModule !mod_authz_core.c>\nDeny from all\n</IfModule>\n");
}

/* ---------- pomocnicze ---------- */

/** Odczyt i zapis pliku JSON pod blokadą – bezpieczne przy jednoczesnych zapisach. */
function zmien_plik(string $plik, callable $fn)
{
    $h = fopen($plik, 'c+');
    if (!$h) {
        throw new RuntimeException('Brak dostępu do pliku danych.');
    }
    flock($h, LOCK_EX);
    $tresc = stream_get_contents($h);
    $dane = $tresc ? (json_decode($tresc, true) ?: []) : [];
    $wynik = $fn($dane);
    ftruncate($h, 0);
    rewind($h);
    fwrite($h, json_encode($dane, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    fflush($h);
    flock($h, LOCK_UN);
    fclose($h);
    return $wynik;
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
    header('Cache-Control: no-store');
    echo json_encode($dane, JSON_UNESCAPED_UNICODE);
    exit;
}

function strona_odp(string $tytul, string $tekst, array $cfg, int $kod = 200): void
{
    http_response_code($kod);
    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-store');
    $t = htmlspecialchars($tytul, ENT_QUOTES, 'UTF-8');
    $x = htmlspecialchars($tekst, ENT_QUOTES, 'UTF-8');
    $u = htmlspecialchars($cfg['adres_strony'], ENT_QUOTES, 'UTF-8');
    echo <<<HTML
<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">
<title>$t · EduKwadrat</title><link rel="stylesheet" href="fonts/fonts.css"><link rel="stylesheet" href="legal.css"></head>
<body><header class="top"><div class="wrap"><a href="$u/">EduKwadrat</a></div></header>
<main class="wrap"><h1>$t</h1><p>$x</p><p><a href="$u/">Wróć na stronę EduKwadrat</a></p></main></body></html>
HTML;
    exit;
}

function wyslij(string $do, string $temat, string $tresc, array $cfg): bool
{
    // Tryb testowy: e-maile zapisywane do plików zamiast wysyłki
    $test = getenv('EDUKWADRAT_TEST_MAIL_DIR');
    if ($test) {
        return (bool) file_put_contents($test . '/' . microtime(true) . '.txt', "Do: $do\nTemat: $temat\n\n$tresc");
    }
    $nadawca = $cfg['nadawca'];
    $naglowki = implode("\r\n", [
        'From: =?UTF-8?B?' . base64_encode($cfg['nadawca_nazwa']) . "?= <$nadawca>",
        "Reply-To: $nadawca",
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
    ]);
    return mail($do, '=?UTF-8?B?' . base64_encode($temat) . '?=', $tresc, $naglowki, '-f' . $nadawca);
}

function link_do(array $cfg, string $param, string $token): string
{
    return rtrim($cfg['adres_strony'], '/') . '/zapis.php?' . $param . '=' . $token;
}

$ip = $_SERVER['REMOTE_ADDR'] ?? '';

/* ---------- potwierdzenie ---------- */

if (isset($_GET['potwierdz'])) {
    $token = preg_replace('/[^a-f0-9]/', '', (string) $_GET['potwierdz']);
    $wynik = zmien_plik($PLIK, function (array &$zapisy) use ($token, $ip, $cfg) {
        sprzataj($zapisy, $cfg);
        foreach ($zapisy as $email => &$z) {
            if ($token !== '' && hash_equals($z['token'], $token)) {
                $nowy = $z['status'] !== 'potwierdzony';
                $z['status'] = 'potwierdzony';
                $z['potwierdzenie_ts'] = $z['potwierdzenie_ts'] ?? time();
                $z['potwierdzenie_ip'] = $z['potwierdzenie_ip'] ?? $ip;
                return ['email' => $email, 'nowy' => $nowy, 'temat' => $z['temat']];
            }
        }
        return null;
    });
    if (!$wynik) {
        strona_odp('Link wygasł', 'Ten link jest nieaktualny. Zapisz się ponownie na stronie – wyślemy nowy link.', $cfg, 404);
    }
    if ($wynik['nowy'] && $cfg['powiadomienia_na']) {
        wyslij($cfg['powiadomienia_na'], 'Nowy zapis na przedsprzedaż', "Adres: {$wynik['email']}\nTemat: " . ($wynik['temat'] ?: '–') . "\nData: " . date('Y-m-d H:i'), $cfg);
    }
    strona_odp('Zapis potwierdzony', 'Dziękujemy. Gdy ruszy pełna wersja EduKwadrat, wyślemy jeden e-mail z linkiem do zakupu w cenie 99 zł.', $cfg);
}

/* ---------- wypisanie ---------- */

if (isset($_GET['wypisz'])) {
    $token = preg_replace('/[^a-f0-9]/', '', (string) $_GET['wypisz']);
    zmien_plik($PLIK, function (array &$zapisy) use ($token) {
        foreach ($zapisy as $email => $z) {
            if ($token !== '' && hash_equals($z['token'], $token)) {
                unset($zapisy[$email]);
            }
        }
    });
    strona_odp('Wypisano', 'Twój adres został usunięty z listy. Nie wyślemy już żadnej wiadomości.', $cfg);
}

/* ---------- eksport ---------- */

if (isset($_GET['eksport'])) {
    $haslo = (string) $cfg['haslo_eksportu'];
    $podane = (string) ($_POST['haslo'] ?? '');
    if ($_SERVER['REQUEST_METHOD'] !== 'POST' || strlen($haslo) < 16 || !hash_equals($haslo, $podane)) {
        if ($podane !== '') {
            sleep(2); // spowalnia zgadywanie hasła
        }
        http_response_code($podane !== '' ? 403 : 200);
        header('Content-Type: text/html; charset=utf-8');
        header('Cache-Control: no-store');
        $info = strlen($haslo) < 16
            ? '<p>Eksport jest wyłączony: ustaw hasło (min. 16 znaków) w pliku zapis-ustawienia.php.</p>'
            : ($podane !== '' ? '<p>Nieprawidłowe hasło.</p>' : '');
        echo '<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">'
            . '<title>Eksport zapisów · EduKwadrat</title><link rel="stylesheet" href="fonts/fonts.css"><link rel="stylesheet" href="legal.css"></head>'
            . '<body><main class="wrap"><h1>Eksport zapisów</h1>' . $info
            . '<form method="post" action="zapis.php?eksport"><p><label for="haslo">Hasło eksportu</label><br>'
            . '<input id="haslo" name="haslo" type="password" autocomplete="current-password" required style="font:inherit;padding:.5em;min-width:16em"></p>'
            . '<p><button type="submit" style="font:inherit;padding:.5em 1em">Pobierz listę (CSV)</button></p></form></main></body></html>';
        exit;
    }
    $zapisy = zmien_plik($PLIK, function (array &$zapisy) use ($cfg) {
        sprzataj($zapisy, $cfg);
        return $zapisy;
    });
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="edukwadrat-zapisy-' . date('Y-m-d') . '.csv"');
    header('Cache-Control: no-store');
    $out = fopen('php://output', 'w');
    fwrite($out, "\xEF\xBB\xBF"); // BOM – polskie znaki w Excelu
    fputcsv($out, ['email', 'temat', 'zapis', 'potwierdzenie', 'ip_potwierdzenia', 'link_wypisania'], ';');
    foreach ($zapisy as $email => $z) {
        if ($z['status'] !== 'potwierdzony') {
            continue;
        }
        fputcsv($out, [$email, $z['temat'], date('Y-m-d H:i', $z['zapis_ts']), date('Y-m-d H:i', $z['potwierdzenie_ts']), $z['potwierdzenie_ip'], link_do($cfg, 'wypisz', $z['token'])], ';');
    }
    exit;
}

/* ---------- zapis ---------- */

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_odp(405, ['ok' => false, 'wiadomosc' => 'Nieobsługiwane zapytanie.']);
}

// Tylko z naszej strony
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$host = strtolower(preg_replace('/:\d+$/', '', (string) ($_SERVER['HTTP_HOST'] ?? '')));
if ($origin !== '' && strtolower((string) parse_url($origin, PHP_URL_HOST)) !== $host) {
    json_odp(403, ['ok' => false, 'wiadomosc' => 'Zapis możliwy tylko ze strony EduKwadrat.']);
}

$wejscie = json_decode((string) file_get_contents('php://input'), true);
if (!is_array($wejscie)) {
    $wejscie = $_POST;
}
$email = mb_strtolower(trim((string) ($wejscie['email'] ?? '')));
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
$limit = (int) $cfg['limit_na_godzine'];
$wolno = zmien_plik($LIMITY, function (array &$l) use ($ip, $limit) {
    $teraz = time();
    foreach ($l as $k => $czasy) {
        $l[$k] = array_values(array_filter($czasy, fn ($t) => $t > $teraz - 3600));
        if (!$l[$k]) {
            unset($l[$k]);
        }
    }
    $klucz = hash('sha256', $ip);
    if (count($l[$klucz] ?? []) >= $limit) {
        return false;
    }
    $l[$klucz][] = $teraz;
    return true;
});
if (!$wolno) {
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
        'zapis_ts' => time(),
        'zapis_ip' => $ip,
        'zrodlo' => 'strona – przedsprzedaż',
    ];
    return $token;
});

if ($doWyslania) {
    $tresc = "Dzień dobry,\n\n"
        . "ktoś (prawdopodobnie Ty) zapisał ten adres na przedsprzedaż EduKwadrat – aplikacji do nauki matematyki przed egzaminem ósmoklasisty.\n\n"
        . "Aby potwierdzić zapis, kliknij:\n" . link_do($cfg, 'potwierdz', $doWyslania) . "\n\n"
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
