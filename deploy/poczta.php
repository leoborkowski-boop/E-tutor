<?php
/**
 * Wysyłka e-maili (wspólna dla zapis.php i api/): przez skrzynkę nadawcy (SMTP z logowaniem, SSL port 465),
 * a gdy smtp_haslo jest puste lub logowanie się nie uda – zapasowo funkcją mail() serwera.
 * Ustawienia: zapis-ustawienia.php. Ten plik nie jest dostępny z przeglądarki (.htaccess).
 */
declare(strict_types=1);

function poczta_wyslij(string $do, string $temat, string $tresc, array $cfg): bool
{
    // Tryb testowy: e-maile zapisywane do plików zamiast wysyłki
    $test = getenv('EDUKWADRAT_TEST_MAIL_DIR');
    if ($test && empty($cfg['smtp_haslo'])) {
        return (bool) file_put_contents($test . '/' . microtime(true) . '.txt', "Do: $do\nTemat: $temat\n\n$tresc");
    }
    $nadawca = (string) $cfg['nadawca'];
    if (!filter_var($nadawca, FILTER_VALIDATE_EMAIL) || !filter_var($do, FILTER_VALIDATE_EMAIL)) {
        return false;
    }
    $domena = substr(strrchr($nadawca, '@'), 1);
    $naglowki = [
        'Date: ' . date('r'),
        'Message-ID: <' . bin2hex(random_bytes(12)) . '@' . $domena . '>',
        'From: =?UTF-8?B?' . base64_encode((string) $cfg['nadawca_nazwa']) . "?= <$nadawca>",
        "Reply-To: $nadawca",
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: quoted-printable',
        'Auto-Submitted: auto-generated',
    ];
    $tematZak = '=?UTF-8?B?' . base64_encode($temat) . '?=';
    $cialo = quoted_printable_encode(str_replace(["\r\n", "\r"], "\n", $tresc));

    // Wysyłka przez skrzynkę (SMTP z logowaniem) – wiadomości są podpisane DKIM i rzadziej trafiają do spamu
    if (!empty($cfg['smtp_haslo'])) {
        $naglowki[] = "To: <$do>";
        $naglowki[] = "Subject: $tematZak";
        if (poczta_smtp($cfg, $nadawca, $do, implode("\r\n", $naglowki) . "\r\n\r\n" . $cialo)) {
            return true;
        }
        // Logowanie do skrzynki się nie udało (np. zmienione hasło) – zapis nie może przez to przestać działać
        array_splice($naglowki, -2);
        if ($test) {
            return (bool) file_put_contents($test . '/zapas-' . microtime(true) . '.txt', "Do: $do\nTemat: $temat\n\n$tresc");
        }
    }
    // Zapasowo: funkcja mail() serwera (bez logowania do skrzynki)
    return mail($do, $tematZak, $cialo, implode("\r\n", $naglowki), '-f' . $nadawca);
}

/** Minimalny klient SMTP: połączenie szyfrowane (SSL, port 465), logowanie AUTH LOGIN. */
function poczta_smtp(array $cfg, string $od, string $do, string $wiadomosc): bool
{
    $serwer = (string) ($cfg['smtp_serwer'] ?? '');
    $port = (int) ($cfg['smtp_port'] ?? 465);
    $sprawdzaj = getenv('EDUKWADRAT_TEST_SMTP_NO_VERIFY') ? false : true;
    $ctx = stream_context_create(['ssl' => ['verify_peer' => $sprawdzaj, 'verify_peer_name' => $sprawdzaj]]);
    $s = @stream_socket_client("ssl://$serwer:$port", $nr, $blad, 15, STREAM_CLIENT_CONNECT, $ctx);
    if (!$s) {
        error_log("EduKwadrat SMTP: brak połączenia z $serwer:$port ($blad)");
        return false;
    }
    stream_set_timeout($s, 15);
    $odp = function () use ($s): string {
        $wszystko = '';
        while (($linia = fgets($s, 1024)) !== false) {
            $wszystko .= $linia;
            if (strlen($linia) < 4 || $linia[3] === ' ') {
                break;
            }
        }
        return $wszystko;
    };
    // $etykieta trafia do dziennika błędów zamiast polecenia – login i hasło nigdy nie są zapisywane
    $krok = function (?string $polecenie, string $oczekiwany, string $etykieta) use ($s, $odp): bool {
        if ($polecenie !== null) {
            fwrite($s, $polecenie . "\r\n");
        }
        $r = $odp();
        if (strpos($r, $oczekiwany) !== 0) {
            error_log("EduKwadrat SMTP: $etykieta → " . substr(trim($r), 0, 200));
            return false;
        }
        return true;
    };
    $domena = substr(strrchr($od, '@'), 1);
    // kropka na początku linii musi być podwojona (zasada protokołu SMTP)
    $dane = preg_replace('/^\./m', '..', str_replace(["\r\n", "\r", "\n"], ["\n", "\n", "\r\n"], $wiadomosc));
    $ok = $krok(null, '220', 'powitanie')
        && $krok("EHLO $domena", '250', 'EHLO')
        && $krok('AUTH LOGIN', '334', 'AUTH')
        && $krok(base64_encode($od), '334', 'login')
        && $krok(base64_encode((string) $cfg['smtp_haslo']), '235', 'hasło (sprawdź smtp_haslo)')
        && $krok("MAIL FROM:<$od>", '250', 'MAIL FROM')
        && $krok("RCPT TO:<$do>", '25', 'RCPT TO')
        && $krok('DATA', '354', 'DATA')
        && $krok($dane . "\r\n.", '250', 'treść');
    fwrite($s, "QUIT\r\n");
    fclose($s);
    return $ok;
}
