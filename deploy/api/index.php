<?php
/**
 * EduKwadrat – API kont. Wszystkie żądania: api/index.php?a=<akcja>
 *
 *   POST rejestracja      {email, haslo, zgoda}            → wysyła e-mail z linkiem potwierdzającym
 *   GET/POST potwierdz    ?t=KOD                           → strona z przyciskiem; kliknięcie potwierdza adres
 *   POST logowanie        {email, haslo, urzadzenie?}      → {token, ...}
 *   POST wyloguj          (token)
 *   POST ja               (token)                          → dane konta i uprawnienia
 *   POST ponow            (token)                          → ponownie wysyła e-mail potwierdzający
 *   POST zapomnialem      {email}                          → wysyła link do zmiany hasła
 *   GET/POST reset        ?t=KOD                           → strona ze zmianą hasła
 *   POST zmien_haslo      {stare, nowe} (token)
 *   GET  postepy          (token)                          → {wersja, dane}
 *   POST postepy          {dane, wersja} (token)           → zapis (409, gdy ktoś zapisał w międzyczasie)
 *   POST usun             {haslo} (token)                  → trwałe usunięcie konta i danych
 *
 * Token sesji idzie w nagłówku X-Edu-Token (nie Authorization – część serwerów go nie przekazuje do PHP).
 */
declare(strict_types=1);

ini_set('display_errors', '0');
ini_set('log_errors', '1');

require __DIR__ . '/biblioteka.php';
require dirname(__DIR__) . '/poczta.php';

/* ---------- odpowiedzi ---------- */

function naglowki_wspolne(): void
{
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: no-referrer');
    header('X-Frame-Options: DENY');
    header('Cache-Control: no-store');
    header('X-Robots-Tag: noindex, nofollow');
}

/** Pozwala na zapytania z naszej strony i z aplikacji na Androidzie (Capacitor: https://localhost). */
function cors(): void
{
    $origin = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
    if ($origin === '') {
        return;
    }
    $host = strtolower((string) preg_replace('/:\d+$/', '', (string) ($_SERVER['HTTP_HOST'] ?? '')));
    $oHost = strtolower((string) parse_url($origin, PHP_URL_HOST));
    $dozwolone = ['https://localhost', 'capacitor://localhost'];
    if ($oHost === $host || in_array($origin, $dozwolone, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, X-Edu-Token');
        header('Access-Control-Max-Age: 86400');
    }
}

function odp(int $kod, array $dane): never
{
    http_response_code($kod);
    header('Content-Type: application/json; charset=utf-8');
    header("Content-Security-Policy: default-src 'none'");
    echo json_encode($dane, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function blad(int $kod, string $komunikat, array $dodatkowe = []): never
{
    odp($kod, ['ok' => false, 'blad' => $komunikat] + $dodatkowe);
}

function e(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
}

function adres_strony(): string
{
    return rtrim((string) (ustawienia()['adres_strony'] ?? ''), '/');
}

/** Strona HTML (potwierdzenie, zmiana hasła). $html – gotowa, bezpieczna treść dodatkowa. */
function strona(string $tytul, string $tekst, string $html = '', int $kod = 200): never
{
    http_response_code($kod);
    header('Content-Type: text/html; charset=utf-8');
    header("Content-Security-Policy: default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; form-action 'self'; frame-ancestors 'none'; base-uri 'none'; object-src 'none'");
    $u = e(adres_strony());
    echo '<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
        . '<meta name="robots" content="noindex"><meta name="referrer" content="no-referrer">'
        . '<title>' . e($tytul) . ' · EduKwadrat</title><link rel="stylesheet" href="../fonts/fonts.css"><link rel="stylesheet" href="../legal.css"></head>'
        . '<body><header class="top"><div class="wrap"><a href="' . $u . '/">EduKwadrat</a></div></header>'
        . '<main class="wrap"><h1>' . e($tytul) . '</h1><p>' . e($tekst) . '</p>' . $html
        . '<p><a href="' . $u . '/aplikacja/">Przejdź do aplikacji</a></p></main></body></html>';
    exit;
}

/* ---------- wejście ---------- */

function wejscie(): array
{
    $surowe = (string) file_get_contents('php://input', false, null, 0, POSTEPY_MAX + 4096);
    if (strlen($surowe) > POSTEPY_MAX + 2048) {
        blad(413, 'Zapytanie jest za duże.');
    }
    $d = json_decode($surowe, true);
    return is_array($d) ? $d : [];
}

/** Wejście jako obiekty (stdClass): puste {} nie zamienia się na [] przy ponownym kodowaniu – ważne dla zapisu postępów. */
function wejscie_obiekt(): ?stdClass
{
    $surowe = (string) file_get_contents('php://input', false, null, 0, POSTEPY_MAX + 4096);
    if (strlen($surowe) > POSTEPY_MAX + 2048) {
        blad(413, 'Zapytanie jest za duże.');
    }
    $d = json_decode($surowe);
    return $d instanceof stdClass ? $d : null;
}

function tekst(array $d, string $pole, int $max = 300): string
{
    $v = $d[$pole] ?? '';
    return is_string($v) ? mb_substr($v, 0, $max) : '';
}

function ip_klienta(): string
{
    $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
    $publiczny = fn ($a) => (bool) filter_var($a, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE);
    if (!$publiczny($ip) && !empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        foreach (array_reverse(array_map('trim', explode(',', (string) $_SERVER['HTTP_X_FORWARDED_FOR']))) as $a) {
            if ($publiczny($a)) {
                return $a;
            }
        }
    }
    return $ip;
}

function wymagaj_post(): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        blad(405, 'Nieobsługiwane zapytanie.');
    }
}

/** Zwraca zalogowanego użytkownika albo kończy odpowiedzią 401. */
function zalogowany(): array
{
    $u = uzytkownik_z_tokenu((string) ($_SERVER['HTTP_X_EDU_TOKEN'] ?? ''));
    if (!$u) {
        blad(401, 'Sesja wygasła. Zaloguj się ponownie.', ['wylogowano' => true]);
    }
    return $u;
}

function opis_konta(array $u): array
{
    return [
        'email' => $u['email'],
        'zweryfikowany' => $u['zweryfikowano'] !== null,
        'dostep' => dostep_aktywny((int) $u['id']),
    ];
}

/* ---------- e-maile ---------- */

function wyslij_mail(string $do, string $temat, string $tresc): bool
{
    return poczta_wyslij($do, $temat, $tresc, ustawienia());
}

function mail_potwierdzenie(string $email, string $kod): bool
{
    return wyslij_mail($email, 'Potwierdź konto w EduKwadrat',
        "Dzień dobry,\n\nktoś (prawdopodobnie Ty) założył konto w EduKwadrat na ten adres e-mail.\n\n"
        . "Aby potwierdzić adres, otwórz link, wpisz hasło ustawione przy zakładaniu konta i kliknij „Potwierdzam”:\n"
        . adres_strony() . '/api/index.php?a=potwierdz&t=' . $kod . "\n\n"
        . "Link działa przez 3 dni. Jeśli to nie Ty, zignoruj tę wiadomość – konto zostanie usunięte po " . NIEPOTWIERDZONE_DNI . " dniach.\n\n"
        . "EduKwadrat – nauka do kwadratu\n" . adres_strony() . "/polityka-prywatnosci.html\n");
}

function mail_istniejace_konto(string $email): bool
{
    return wyslij_mail($email, 'Masz już konto w EduKwadrat',
        "Dzień dobry,\n\nktoś próbował założyć konto w EduKwadrat na ten adres, ale konto już istnieje.\n\n"
        . "Jeśli to Ty, zaloguj się w aplikacji: " . adres_strony() . "/aplikacja/\n"
        . "Jeśli nie pamiętasz hasła, wybierz w aplikacji „Nie pamiętam hasła”.\n"
        . "Jeśli to nie Ty, zignoruj tę wiadomość – nic się nie zmieniło.\n\n"
        . "EduKwadrat – nauka do kwadratu\n");
}

function mail_reset(string $email, string $kod): bool
{
    return wyslij_mail($email, 'Zmiana hasła w EduKwadrat',
        "Dzień dobry,\n\nktoś (prawdopodobnie Ty) poprosił o zmianę hasła w EduKwadrat.\n\n"
        . "Aby ustawić nowe hasło, otwórz link (ważny 1 godzinę):\n"
        . adres_strony() . '/api/index.php?a=reset&t=' . $kod . "\n\n"
        . "Jeśli to nie Ty, zignoruj tę wiadomość – hasło zostaje bez zmian.\n\n"
        . "EduKwadrat – nauka do kwadratu\n");
}

/* ---------- akcje ---------- */

const OGOLNA_ODPOWIEDZ = 'Sprawdź skrzynkę (także spam): wysłaliśmy wiadomość z dalszymi krokami.';

function akcja_rejestracja(): never
{
    wymagaj_post();
    $d = wejscie();
    $email = normalizuj_email(tekst($d, 'email', 254));
    $haslo = tekst($d, 'haslo', 200);
    if (!email_poprawny($email)) {
        blad(400, 'Wpisz poprawny adres e-mail, np. imie@przyklad.pl.');
    }
    if (empty($d['zgoda'])) {
        blad(400, 'Zaznacz, że akceptujesz regulamin i politykę prywatności.');
    }
    if (($b = haslo_blad($haslo, $email)) !== null) {
        blad(400, $b);
    }
    if (!limit('rejestracja:' . ip_klienta(), 5, 3600)) {
        blad(429, 'Za dużo prób w krótkim czasie. Spróbuj ponownie za godzinę.');
    }
    if (random_int(1, 20) === 1) {
        sprzatanie();
    }
    // najwyżej 3 wiadomości na dobę na ten sam adres – nikt nie zasypie cudzej skrzynki
    if (limit_przekroczony('mail-rej:' . $email, 3, 86400)) {
        odp(200, ['ok' => true, 'wiadomosc' => OGOLNA_ODPOWIEDZ]);
    }
    limit_dodaj('mail-rej:' . $email, 86400);

    $u = uzytkownik_po_emailu($email);
    $t = time();
    if ($u && $u['zweryfikowano'] !== null) {
        mail_istniejace_konto($email);   // nie zdradzamy, że konto istnieje
    } else {
        $hash = haslo_hash($haslo);
        if ($u) {   // konto niepotwierdzone: właściciel adresu zakłada je od nowa – stare sesje i hasło przestają działać
            db()->prepare('UPDATE uzytkownicy SET haslo_hash = ?, zgoda_ts = ?, zgoda_wersja = ?, utworzono = ? WHERE id = ?')
                ->execute([$hash, $t, REGULAMIN_WERSJA, $t, $u['id']]);
            tokeny_usun_uzytkownika((int) $u['id']);
            $uid = (int) $u['id'];
        } else {
            try {
                db()->prepare('INSERT INTO uzytkownicy (email, haslo_hash, utworzono, zgoda_ts, zgoda_wersja) VALUES (?, ?, ?, ?, ?)')
                    ->execute([$email, $hash, $t, $t, REGULAMIN_WERSJA]);
            } catch (PDOException $e) {
                odp(200, ['ok' => true, 'wiadomosc' => OGOLNA_ODPOWIEDZ]);   // równoległa rejestracja tego samego adresu
            }
            $uid = (int) db()->lastInsertId();
        }
        mail_potwierdzenie($email, kod_utworz($uid, 'weryfikacja', 3 * 86400));
    }
    odp(200, ['ok' => true, 'wiadomosc' => OGOLNA_ODPOWIEDZ]);
}

function akcja_potwierdz(): never
{
    $kod = (string) ($_GET['t'] ?? $_POST['t'] ?? '');
    $w = kod_sprawdz($kod, 'weryfikacja');
    if (!$w) {
        strona('Link wygasł', 'Ten link jest nieaktualny. Zaloguj się w aplikacji i poproś o nowy e-mail potwierdzający.', '', 404);
    }
    // Potwierdzenie wymaga hasła konta. Dzięki temu nikt nie przejmie cudzego adresu: osoba, która założyła konto
    // na czyjś e-mail z własnym hasłem, nie sprawi, że prawdziwy właściciel potwierdzi je kliknięciem w link.
    $formularz = fn (string $komunikat = '', int $kodHttp = 200) => strona('Potwierdź konto',
        $komunikat !== '' ? $komunikat : 'Wpisz hasło ustawione przy zakładaniu konta i kliknij „Potwierdzam”.',
        '<form method="post" action="index.php?a=potwierdz"><input type="hidden" name="t" value="' . e($kod) . '">'
        . '<p><label for="h">Hasło do konta</label><br><input id="h" name="haslo" type="password" required autocomplete="current-password" style="font:inherit;padding:.5em;min-width:16em"></p>'
        . '<p><button type="submit" style="font:inherit;font-weight:600;padding:.6em 1.2em;cursor:pointer">Potwierdzam</button></p></form>'
        . '<p class="meta">Nie pamiętasz hasła albo to nie Ty zakładał(a) konto? Zignoruj tę wiadomość; hasło zmienisz w aplikacji („Nie pamiętam hasła”).</p>',
        $kodHttp);
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {   // skanery poczty otwierają linki – potwierdza dopiero wysłanie formularza z hasłem
        $formularz();
    }
    if (!limit('potwierdz-ip:' . ip_klienta(), 20, 900)) {
        strona('Za dużo prób', 'Spróbuj ponownie za 15 minut.', '', 429);
    }
    $st = db()->prepare('SELECT * FROM uzytkownicy WHERE id = ?');
    $st->execute([$w['uzytkownik_id']]);
    $u = $st->fetch();
    if (!$u || !haslo_ok((string) ($_POST['haslo'] ?? ''), (string) $u['haslo_hash'])) {
        limit_dodaj('potwierdz-kod:' . $w['id'], 3600);
        if (limit_przekroczony('potwierdz-kod:' . $w['id'], 5, 3600)) {   // po 5 błędach link przestaje działać
            db()->prepare('DELETE FROM kody WHERE id = ?')->execute([$w['id']]);
            strona('Link wygasł', 'Podano zbyt wiele razy złe hasło. Zaloguj się w aplikacji i poproś o nowy e-mail potwierdzający.', '', 403);
        }
        $formularz('Hasło jest nieprawidłowe. Wpisz hasło ustawione przy zakładaniu konta.', 403);
    }
    db()->prepare('UPDATE uzytkownicy SET zweryfikowano = ? WHERE id = ? AND zweryfikowano IS NULL')->execute([time(), $w['uzytkownik_id']]);
    db()->prepare('DELETE FROM kody WHERE id = ?')->execute([$w['id']]);
    strona('Konto potwierdzone', 'Dziękujemy. Adres e-mail jest potwierdzony – możesz korzystać z konta w aplikacji.');
}

function akcja_logowanie(): never
{
    wymagaj_post();
    $d = wejscie();
    $email = normalizuj_email(tekst($d, 'email', 254));
    $haslo = tekst($d, 'haslo', 200);
    $ip = ip_klienta();
    $blokada = 'Za dużo nieudanych prób logowania. Spróbuj ponownie za 15 minut.';
    // limity: ogólny z adresu IP, nieudane próby dla pary adres+IP oraz globalnie dla adresu (utrudnia atak z wielu IP)
    if (!limit('logowanie-ip:' . $ip, 60, 900)
        || limit_przekroczony('logowanie-nie:' . $email . '|' . $ip, 8, 900)
        || limit_przekroczony('logowanie-email:' . $email, 40, 3600)) {
        blad(429, $blokada);
    }
    $u = email_poprawny($email) ? uzytkownik_po_emailu($email) : null;
    $ok = haslo_ok($haslo, $u ? $u['haslo_hash'] : haslo_atrapa()) && $u;
    if (!$ok) {
        limit_dodaj('logowanie-nie:' . $email . '|' . $ip, 900);
        limit_dodaj('logowanie-email:' . $email, 3600);
        blad(401, 'Nieprawidłowy e-mail lub hasło.');
    }
    $uid = (int) $u['id'];
    if (password_needs_rehash($u['haslo_hash'], defined('PASSWORD_ARGON2ID') ? PASSWORD_ARGON2ID : PASSWORD_BCRYPT)) {
        db()->prepare('UPDATE uzytkownicy SET haslo_hash = ? WHERE id = ?')->execute([haslo_hash($haslo), $uid]);
    }
    db()->prepare('UPDATE uzytkownicy SET ostatnie_logowanie = ? WHERE id = ?')->execute([time(), $uid]);
    $token = token_utworz($uid, tekst($d, 'urzadzenie', 80));
    odp(200, ['ok' => true, 'token' => $token] + opis_konta($u));
}

function akcja_wyloguj(): never
{
    wymagaj_post();
    $u = zalogowany();
    db()->prepare('DELETE FROM tokeny WHERE id = ?')->execute([$u['token_id']]);
    odp(200, ['ok' => true]);
}

function akcja_ja(): never
{
    odp(200, ['ok' => true] + opis_konta(zalogowany()));
}

function akcja_ponow(): never
{
    wymagaj_post();
    $u = zalogowany();
    if ($u['zweryfikowano'] !== null) {
        odp(200, ['ok' => true, 'wiadomosc' => 'Adres jest już potwierdzony.']);
    }
    if (limit_przekroczony('mail-rej:' . $u['email'], 3, 86400)) {
        blad(429, 'Wysłaliśmy już kilka wiadomości. Spróbuj ponownie jutro.');
    }
    limit_dodaj('mail-rej:' . $u['email'], 86400);
    mail_potwierdzenie($u['email'], kod_utworz((int) $u['id'], 'weryfikacja', 3 * 86400));
    odp(200, ['ok' => true, 'wiadomosc' => 'Wysłaliśmy nowy e-mail potwierdzający.']);
}

function akcja_zapomnialem(): never
{
    wymagaj_post();
    $email = normalizuj_email(tekst(wejscie(), 'email', 254));
    if (!email_poprawny($email)) {
        blad(400, 'Wpisz poprawny adres e-mail.');
    }
    if (!limit('reset-ip:' . ip_klienta(), 5, 3600)) {
        blad(429, 'Za dużo prób w krótkim czasie. Spróbuj ponownie za godzinę.');
    }
    if (!limit_przekroczony('mail-reset:' . $email, 3, 86400)) {
        limit_dodaj('mail-reset:' . $email, 86400);
        $u = uzytkownik_po_emailu($email);
        if ($u) {
            mail_reset($email, kod_utworz((int) $u['id'], 'reset', 3600));
        }
    }
    odp(200, ['ok' => true, 'wiadomosc' => 'Jeśli konto z tym adresem istnieje, wysłaliśmy link do zmiany hasła. Sprawdź skrzynkę (także spam).']);
}

function akcja_reset(): never
{
    $post = ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST';
    $kod = (string) ($_GET['t'] ?? $_POST['t'] ?? '');
    $w = kod_sprawdz($kod, 'reset');
    if (!$w) {
        strona('Link wygasł', 'Ten link do zmiany hasła jest nieaktualny. Poproś o nowy w aplikacji („Nie pamiętam hasła”).', '', 404);
    }
    $formularz = fn (string $komunikat = '') => strona('Nowe hasło', $komunikat !== '' ? $komunikat : 'Wpisz nowe hasło do konta (co najmniej 8 znaków).',
        '<form method="post" action="index.php?a=reset"><input type="hidden" name="t" value="' . e($kod) . '">'
        . '<p><label for="h1">Nowe hasło</label><br><input id="h1" name="haslo" type="password" minlength="8" required autocomplete="new-password" style="font:inherit;padding:.5em;min-width:16em"></p>'
        . '<p><label for="h2">Powtórz hasło</label><br><input id="h2" name="haslo2" type="password" minlength="8" required autocomplete="new-password" style="font:inherit;padding:.5em;min-width:16em"></p>'
        . '<p><button type="submit" style="font:inherit;font-weight:600;padding:.6em 1.2em;cursor:pointer">Zmień hasło</button></p></form>',
        $komunikat !== '' ? 400 : 200);
    if (!$post) {
        $formularz();
    }
    $h1 = (string) ($_POST['haslo'] ?? '');
    $h2 = (string) ($_POST['haslo2'] ?? '');
    $st = db()->prepare('SELECT * FROM uzytkownicy WHERE id = ?');
    $st->execute([$w['uzytkownik_id']]);
    $u = $st->fetch();
    if (!$u) {
        strona('Link wygasł', 'Konto nie istnieje.', '', 404);
    }
    if ($h1 !== $h2) {
        $formularz('Hasła się różnią. Spróbuj jeszcze raz.');
    }
    if (($b = haslo_blad($h1, (string) $u['email'])) !== null) {
        $formularz($b);
    }
    w_transakcji(function (PDO $pdo) use ($u, $h1, $w) {
        $pdo->prepare('UPDATE uzytkownicy SET haslo_hash = ?, zweryfikowano = COALESCE(zweryfikowano, ?) WHERE id = ?')
            ->execute([haslo_hash($h1), time(), $u['id']]);   // skoro dotarł e-mail, adres jest potwierdzony
        $pdo->prepare('DELETE FROM kody WHERE uzytkownik_id = ? AND rodzaj = ?')->execute([$u['id'], 'reset']);
        $pdo->prepare('DELETE FROM tokeny WHERE uzytkownik_id = ?')->execute([$u['id']]);   // wylogowanie ze wszystkich urządzeń
    });
    strona('Hasło zmienione', 'Nowe hasło działa. Zaloguj się nim w aplikacji.');
}

function akcja_zmien_haslo(): never
{
    wymagaj_post();
    $u = zalogowany();
    $d = wejscie();
    if (limit_przekroczony('zmiana-hasla:' . $u['id'], 8, 900)) {
        blad(429, 'Za dużo prób. Spróbuj ponownie za 15 minut.');
    }
    if (!haslo_ok(tekst($d, 'stare', 200), $u['haslo_hash'])) {
        limit_dodaj('zmiana-hasla:' . $u['id'], 900);
        blad(403, 'Obecne hasło jest nieprawidłowe.');
    }
    $nowe = tekst($d, 'nowe', 200);
    if (($b = haslo_blad($nowe, (string) $u['email'])) !== null) {
        blad(400, $b);
    }
    db()->prepare('UPDATE uzytkownicy SET haslo_hash = ? WHERE id = ?')->execute([haslo_hash($nowe), $u['id']]);
    tokeny_usun_uzytkownika((int) $u['id'], (int) $u['token_id']);   // inne urządzenia trzeba zalogować od nowa
    odp(200, ['ok' => true]);
}

function akcja_postepy(): never
{
    $u = zalogowany();
    $uid = (int) $u['id'];
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        $st = db()->prepare('SELECT dane, wersja, zmieniono FROM postepy WHERE uzytkownik_id = ?');
        $st->execute([$uid]);
        $r = $st->fetch();
        odp(200, ['ok' => true, 'wersja' => $r ? (int) $r['wersja'] : 0, 'zmieniono' => $r ? (int) $r['zmieniono'] : 0,
            'dane' => $r ? json_decode((string) $r['dane']) : null]);
    }
    if (!limit('postepy:' . $uid, 120, 3600)) {
        blad(429, 'Zbyt wiele zapisów. Spróbuj ponownie za chwilę.');
    }
    $d = wejscie_obiekt();
    if (!$d || !isset($d->dane) || !($d->dane instanceof stdClass) || !isset($d->wersja) || !is_int($d->wersja)) {
        blad(400, 'Niepoprawne dane.');
    }
    $json = json_encode($d->dane, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false || strlen($json) > POSTEPY_MAX) {
        blad(413, 'Postępy są za duże, żeby je zapisać.');
    }
    $wersja = $d->wersja;
    $wynik = w_transakcji(function (PDO $pdo) use ($uid, $wersja, $json) {
        $st = $pdo->prepare('SELECT dane, wersja FROM postepy WHERE uzytkownik_id = ?' . dla_aktualizacji());
        $st->execute([$uid]);
        $r = $st->fetch();
        $obecna = $r ? (int) $r['wersja'] : 0;
        if ($obecna !== $wersja) {
            return ['konflikt' => true, 'wersja' => $obecna, 'dane' => $r ? json_decode((string) $r['dane']) : null];
        }
        if ($r) {
            $pdo->prepare('UPDATE postepy SET dane = ?, wersja = ?, zmieniono = ? WHERE uzytkownik_id = ?')->execute([$json, $obecna + 1, time(), $uid]);
        } else {
            $pdo->prepare('INSERT INTO postepy (uzytkownik_id, dane, wersja, zmieniono) VALUES (?, ?, 1, ?)')->execute([$uid, $json, time()]);
        }
        return ['konflikt' => false, 'wersja' => $obecna + 1];
    });
    if ($wynik['konflikt']) {
        blad(409, 'Postępy zostały w międzyczasie zmienione na innym urządzeniu.', ['konflikt' => true, 'wersja' => $wynik['wersja'], 'dane' => $wynik['dane']]);
    }
    odp(200, ['ok' => true, 'wersja' => $wynik['wersja']]);
}

function akcja_usun(): never
{
    wymagaj_post();
    $u = zalogowany();
    if (limit_przekroczony('usuwanie:' . $u['id'], 5, 900)) {
        blad(429, 'Za dużo prób. Spróbuj ponownie za 15 minut.');
    }
    if (!haslo_ok(tekst(wejscie(), 'haslo', 200), $u['haslo_hash'])) {
        limit_dodaj('usuwanie:' . $u['id'], 900);
        blad(403, 'Hasło jest nieprawidłowe.');
    }
    konto_usun((int) $u['id']);
    odp(200, ['ok' => true]);
}

/* ---------- start ---------- */

naglowki_wspolne();
cors();
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$akcje = [
    'rejestracja' => 'akcja_rejestracja', 'potwierdz' => 'akcja_potwierdz', 'logowanie' => 'akcja_logowanie',
    'wyloguj' => 'akcja_wyloguj', 'ja' => 'akcja_ja', 'ponow' => 'akcja_ponow', 'zapomnialem' => 'akcja_zapomnialem',
    'reset' => 'akcja_reset', 'zmien_haslo' => 'akcja_zmien_haslo', 'postepy' => 'akcja_postepy', 'usun' => 'akcja_usun',
];
$a = (string) ($_GET['a'] ?? '');
try {
    if (!isset($akcje[$a])) {
        blad(404, 'Nie ma takiej akcji.');
    }
    $akcje[$a]();
} catch (KontoNieSkonfigurowane $e) {
    blad(503, 'Konta nie są jeszcze skonfigurowane na serwerze.', ['niedostepne' => true]);
} catch (Throwable $e) {
    error_log('EduKwadrat konta: ' . get_class($e) . ': ' . $e->getMessage() . ' @ ' . basename($e->getFile()) . ':' . $e->getLine());
    if (in_array($a, ['potwierdz', 'reset'], true)) {
        strona('Błąd', 'Coś poszło nie tak po naszej stronie. Spróbuj ponownie za chwilę.', '', 500);
    }
    blad(500, 'Coś poszło nie tak po naszej stronie. Spróbuj ponownie za chwilę.');
}
