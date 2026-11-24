#!/usr/bin/env python3
"""Testy serwera kont (deploy/api) na lokalnym serwerze PHP z bazą SQLite.
Użycie: python3 scripts/test-konta.py        (wymaga php-cli z pdo_sqlite)
Maile zapisują się do plików zamiast wysyłki (EDUKWADRAT_TEST_MAIL_DIR).
"""
import glob
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
PORT = 8097
BASE = f'http://127.0.0.1:{PORT}'
API = BASE + '/api/index.php'
TMP = tempfile.mkdtemp(prefix='konta-test-')
WWW = os.path.join(TMP, 'www')
MAIL = os.path.join(TMP, 'mail')
os.makedirs(MAIL)
shutil.copytree(os.path.join(ROOT, 'deploy', 'api'), os.path.join(WWW, 'api'))
shutil.copy(os.path.join(ROOT, 'deploy', 'poczta.php'), WWW)
with open(os.path.join(WWW, 'zapis-ustawienia.php'), 'w') as f:
    f.write(f"<?php return ['nadawca'=>'kontakt@edukwadrat.pl','nadawca_nazwa'=>'EduKwadrat','adres_strony'=>'{BASE}','smtp_haslo'=>''];")
MYSQL = os.environ.get('KONTA_TEST_MYSQL') == '1'   # KONTA_TEST_MYSQL=1: baza MySQL/MariaDB edutest (użytkownik edu / edupass)
if MYSQL:
    subprocess.run(['mysql', '-e', 'DROP DATABASE IF EXISTS edutest; CREATE DATABASE edutest CHARACTER SET utf8mb4'], check=True)
    with open(os.path.join(WWW, 'konto-ustawienia.php'), 'w') as f:
        f.write("<?php return ['db_host'=>'127.0.0.1','db_nazwa'=>'edutest','db_uzytkownik'=>'edu','db_haslo'=>'edupass'];")
else:
    with open(os.path.join(WWW, 'konto-ustawienia.php'), 'w') as f:
        f.write(f"<?php return ['db_dsn'=>'sqlite:{TMP}/konta.sqlite'];")


def sql(q):
    """Zapytanie do bazy testowej (SQLite albo MySQL przez klienta mysql). Zwraca listę krotek tekstów/liczb."""
    if MYSQL:
        out = subprocess.run(['mysql', '-N', '-B', 'edutest', '-e', q], capture_output=True, text=True, check=True).stdout
        return [tuple(x.split('\t')) for x in out.splitlines()]
    import sqlite3
    c = sqlite3.connect(os.path.join(TMP, 'konta.sqlite'))
    r = c.execute(q).fetchall()
    c.commit()
    c.close()
    return [tuple(str(v) for v in row) for row in r]


def dump():
    """Cała zawartość bazy jako bajty (do szukania jawnych haseł i tokenów)."""
    if MYSQL:
        return subprocess.run(['mysqldump', '--skip-extended-insert', 'edutest'], capture_output=True, check=True).stdout
    return open(os.path.join(TMP, 'konta.sqlite'), 'rb').read()


env = dict(os.environ, EDUKWADRAT_TEST_MAIL_DIR=MAIL)
srv = subprocess.Popen(['php', '-S', f'127.0.0.1:{PORT}', '-t', WWW], env=env, stdout=open(os.path.join(TMP, 'srv.log'), 'w'), stderr=subprocess.STDOUT)
time.sleep(1.0)

PASS = FAIL = 0


def call(action, body=None, token=None, method=None, query='', headers=None, raw=None):
    url = f'{API}?a={action}{query}'
    data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
    req = urllib.request.Request(url, data=data, method=method or ('POST' if data is not None else 'GET'))
    req.add_header('Content-Type', 'application/json')
    if token:
        req.add_header('X-Edu-Token', token)
    for k, v in (headers or {}).items():
        req.add_header(k, v)
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            body_txt, code, hdrs = r.read().decode(), r.status, r.headers
    except urllib.error.HTTPError as e:
        body_txt, code, hdrs = e.read().decode(), e.code, e.headers
    try:
        js = json.loads(body_txt)
    except ValueError:
        js = None
    return code, js, body_txt, hdrs


def check(name, cond, info=''):
    global PASS, FAIL
    if cond:
        PASS += 1
        print(f'  ok   {name}')
    else:
        FAIL += 1
        print(f'  FAIL {name} {info}')


def mails(to=None):
    out = []
    for f in sorted(glob.glob(MAIL + '/*.txt')):
        t = open(f, encoding='utf-8').read()
        if to is None or f'Do: {to}' in t.split('\n')[0]:
            out.append(t)
    return out


def link(mail_text, param):
    m = re.search(r'a=' + param + r'&t=([a-f0-9]{64})', mail_text)
    return m.group(1) if m else None


def page_post(action, fields):
    data = urllib.parse.urlencode(fields).encode()
    req = urllib.request.Request(f'{API}?a={action}', data=data, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status, r.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()


def page_get(action, t):
    try:
        with urllib.request.urlopen(f'{API}?a={action}&t={t}', timeout=20) as r:
            return r.status, r.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()


try:
    print('Rejestracja')
    EM = 'rodzic@przyklad.pl'
    PW = 'Dobre-haslo-123'
    c, j, *_ = call('rejestracja', {'email': 'zly', 'haslo': PW, 'zgoda': True})
    check('zły e-mail odrzucony', c == 400)
    c, j, *_ = call('rejestracja', {'email': EM, 'haslo': PW})
    check('brak zgody odrzucony', c == 400)
    c, j, *_ = call('rejestracja', {'email': EM, 'haslo': '123', 'zgoda': True})
    check('krótkie hasło odrzucone', c == 400)
    c, j, *_ = call('rejestracja', {'email': EM, 'haslo': '12345678', 'zgoda': True})
    check('słabe hasło odrzucone', c == 400)
    c, j, *_ = call('rejestracja', {'email': EM, 'haslo': EM, 'zgoda': True})
    check('hasło równe e-mailowi odrzucone', c == 400)
    c, j, *_ = call('rejestracja', {'email': 'Rodzic@Przyklad.pl', 'haslo': PW, 'zgoda': True})
    check('poprawna rejestracja', c == 200 and j['ok'])
    m = mails(EM)
    check('wysłano e-mail potwierdzający', len(m) == 1 and 'Potwierdź konto' in m[0])
    kod = link(m[0], 'potwierdz')
    check('e-mail ma link z kodem', kod is not None)

    print('Logowanie przed potwierdzeniem')
    c, j, *_ = call('logowanie', {'email': EM, 'haslo': 'zle-haslo-12'})
    check('złe hasło → 401', c == 401)
    c, j, *_ = call('logowanie', {'email': 'nikt@przyklad.pl', 'haslo': PW})
    check('nieistniejące konto → ta sama odpowiedź', c == 401 and j['blad'] == 'Nieprawidłowy e-mail lub hasło.')
    c, j, *_ = call('logowanie', {'email': EM, 'haslo': PW, 'urzadzenie': 'Test'})
    check('logowanie działa', c == 200 and len(j['token']) == 64)
    check('konto jeszcze niepotwierdzone', j['zweryfikowany'] is False)
    T1 = j['token']

    print('Potwierdzenie (przycisk, nie sam link)')
    c, html = page_get('potwierdz', kod)
    check('GET pokazuje formularz z hasłem i przyciskiem', c == 200 and 'Potwierdzam' in html and 'type="password"' in html)
    c, j, *_ = call('ja', token=T1)
    check('GET nie potwierdził konta', j['zweryfikowany'] is False)
    c, html = page_post('potwierdz', {'t': kod})
    check('POST bez hasła nie potwierdza', c == 403)
    c, html = page_post('potwierdz', {'t': kod, 'haslo': 'zle-haslo-xyz'})
    check('POST ze złym hasłem nie potwierdza', c == 403 and 'nieprawidłowe' in html)
    c, j, *_ = call('ja', token=T1)
    check('konto nadal niepotwierdzone', j['zweryfikowany'] is False)
    c, html = page_post('potwierdz', {'t': kod, 'haslo': PW})
    check('POST z hasłem konta potwierdza', c == 200 and 'Konto potwierdzone' in html)
    c, j, *_ = call('ja', token=T1)
    check('konto potwierdzone', j['zweryfikowany'] is True)
    c, html = page_post('potwierdz', {'t': kod, 'haslo': PW})
    check('kod jednorazowy', c == 404)
    c, html = page_get('potwierdz', 'a' * 64)
    check('zły kod → 404', c == 404)

    print('Ponowna rejestracja na istniejący adres')
    n = len(mails(EM))
    c, j, *_ = call('rejestracja', {'email': EM, 'haslo': 'Inne-haslo-456', 'zgoda': True})
    check('ta sama odpowiedź (brak ujawnienia konta)', c == 200 and j['ok'])
    check('wysłano wiadomość „masz już konto”', len(mails(EM)) == n + 1 and 'Masz już konto' in mails(EM)[-1])
    c, j, *_ = call('logowanie', {'email': EM, 'haslo': PW})
    check('stare hasło nadal działa (konto nie przejęte)', c == 200)
    T2 = j['token']

    print('Sesje')
    c, j, *_ = call('ja')
    check('brak tokenu → 401', c == 401)
    c, j, *_ = call('ja', token='0' * 64)
    check('zły token → 401', c == 401)
    c, j, *_ = call('wyloguj', {}, token=T2)
    check('wylogowanie', c == 200)
    c, j, *_ = call('ja', token=T2)
    check('token po wylogowaniu nie działa', c == 401)

    print('Postępy: zapis i konflikt wersji')
    c, j, *_ = call('postepy', token=T1)
    check('początkowo brak danych, wersja 0', c == 200 and j['wersja'] == 0 and j['dane'] is None)
    dane = {'attempts': [{'ts': 1, 'topicId': 'x'}], 'lessons': {'a': {'stars': 3, 'ts': 5}}, 'badges': {}, 'topicMeta': {}, 'exams': []}
    c, j, *_ = call('postepy', {'dane': dane, 'wersja': 0}, token=T1)
    check('pierwszy zapis → wersja 1', c == 200 and j['wersja'] == 1)
    c, j, *_ = call('postepy', token=T1)
    check('odczyt zwraca zapisane dane', j['dane'] == dane and j['wersja'] == 1)
    check('puste obiekty {} nie zamieniają się na []', isinstance(j['dane']['badges'], dict) and isinstance(j['dane']['exams'], list), str(j['dane']))
    c, j, *_ = call('postepy', {'dane': {'x': 1}, 'wersja': 0}, token=T1)
    check('nieaktualna wersja → 409 z danymi serwera', c == 409 and j['konflikt'] and j['dane'] == dane and j['wersja'] == 1)
    c, j, *_ = call('postepy', {'dane': {'x': 2}, 'wersja': 1}, token=T1)
    check('aktualna wersja → zapis', c == 200 and j['wersja'] == 2)
    c, j, *_ = call('postepy', {'dane': 'tekst', 'wersja': 2}, token=T1)
    check('niepoprawny kształt → 400', c == 400)
    c, j, *_ = call('postepy', {'dane': {'x': 'a' * 1_600_000}, 'wersja': 2}, token=T1)
    check('za duże dane → 413', c == 413)
    c, j, *_ = call('postepy', {'dane': {}, 'wersja': 2}, token=None)
    check('zapis bez tokenu → 401', c == 401)

    print('Reset hasła')
    n = len(mails(EM))
    c, j, *_ = call('zapomnialem', {'email': 'nikt@przyklad.pl'})
    check('nieistniejący adres: ta sama odpowiedź', c == 200 and j['ok'])
    check('… i brak wysłanej wiadomości', len(mails('nikt@przyklad.pl')) == 0)
    c, j, *_ = call('zapomnialem', {'email': EM})
    check('istniejący adres: ta sama odpowiedź', c == 200 and j['ok'])
    check('… i wysłano link', len(mails(EM)) == n + 1 and 'Zmiana hasła' in mails(EM)[-1])
    rk = link(mails(EM)[-1], 'reset')
    c, html = page_get('reset', rk)
    check('strona resetu pokazuje formularz', c == 200 and 'type="password"' in html)
    c, html = page_post('reset', {'t': rk, 'haslo': 'Nowe-haslo-789', 'haslo2': 'inne'})
    check('różne hasła odrzucone', c == 400)
    c, html = page_post('reset', {'t': rk, 'haslo': '12345678', 'haslo2': '12345678'})
    check('słabe hasło odrzucone', c == 400)
    c, html = page_post('reset', {'t': rk, 'haslo': 'Nowe-haslo-789', 'haslo2': 'Nowe-haslo-789'})
    check('zmiana hasła', c == 200 and 'Hasło zmienione' in html)
    c, j, *_ = call('ja', token=T1)
    check('reset wylogował inne sesje', c == 401)
    c, html = page_post('reset', {'t': rk, 'haslo': 'Jeszcze-inne-1', 'haslo2': 'Jeszcze-inne-1'})
    check('kod resetu jednorazowy', c == 404)
    c, j, *_ = call('logowanie', {'email': EM, 'haslo': PW})
    check('stare hasło nie działa', c == 401)
    c, j, *_ = call('logowanie', {'email': EM, 'haslo': 'Nowe-haslo-789'})
    check('nowe hasło działa', c == 200)
    T3 = j['token']
    c, j, *_ = call('postepy', token=T3)
    check('postępy zostały po zmianie hasła', j['wersja'] == 2)

    print('Zmiana hasła w aplikacji')
    c, j, *_ = call('logowanie', {'email': EM, 'haslo': 'Nowe-haslo-789'})
    T4 = j['token']
    c, j, *_ = call('zmien_haslo', {'stare': 'zle', 'nowe': 'Kolejne-haslo-1'}, token=T3)
    check('złe obecne hasło → 403', c == 403)
    c, j, *_ = call('zmien_haslo', {'stare': 'Nowe-haslo-789', 'nowe': 'Kolejne-haslo-1'}, token=T3)
    check('zmiana hasła', c == 200)
    c, j, *_ = call('ja', token=T3)
    check('bieżąca sesja zostaje', c == 200)
    c, j, *_ = call('ja', token=T4)
    check('inne sesje wylogowane', c == 401)

    print('Przejęcie cudzego adresu (pre-hijacking)')
    sql('DELETE FROM limity')   # limit 5 rejestracji/godz. z jednego IP zużyły wcześniejsze testy
    A = 'ofiara@przyklad.pl'
    call('rejestracja', {'email': A, 'haslo': 'Haslo-atakujacego-1', 'zgoda': True})
    c, j, *_ = call('logowanie', {'email': A, 'haslo': 'Haslo-atakujacego-1'})
    TA = j['token']
    call('rejestracja', {'email': A, 'haslo': 'Haslo-wlasciciela-2', 'zgoda': True})
    c, j, *_ = call('ja', token=TA)
    check('właściciel założył konto od nowa: sesja atakującego unieważniona', c == 401)
    c, j, *_ = call('logowanie', {'email': A, 'haslo': 'Haslo-atakujacego-1'})
    check('hasło atakującego nie działa', c == 401)
    kod_o = link(mails(A)[-1], 'potwierdz')
    c, html = page_post('potwierdz', {'t': kod_o, 'haslo': 'Haslo-wlasciciela-2'})
    check('właściciel potwierdza swoim hasłem', c == 200)

    # odwrotna kolejność: właściciel założył konto, a atakujący zakłada je od nowa z własnym hasłem
    V = 'ofiara2@przyklad.pl'
    call('rejestracja', {'email': V, 'haslo': 'Haslo-wlasciciela-3', 'zgoda': True})
    call('rejestracja', {'email': V, 'haslo': 'Haslo-atakujacego-3', 'zgoda': True})
    kod_v = link(mails(V)[-1], 'potwierdz')   # e-mail trafia do właściciela
    c, html = page_post('potwierdz', {'t': kod_v, 'haslo': 'Haslo-wlasciciela-3'})
    check('właściciel nie zna hasła atakującego → samo kliknięcie w link nie potwierdza konta', c == 403)
    c, j, *_ = call('zapomnialem', {'email': V})
    rk2 = link(mails(V)[-1], 'reset')
    c, html = page_post('reset', {'t': rk2, 'haslo': 'Haslo-wlasciciela-4x', 'haslo2': 'Haslo-wlasciciela-4x'})
    check('właściciel odzyskuje konto resetem hasła', c == 200)
    c, j, *_ = call('logowanie', {'email': V, 'haslo': 'Haslo-atakujacego-3'})
    check('po resecie hasło atakującego nie działa', c == 401)
    c, j, *_ = call('logowanie', {'email': V, 'haslo': 'Haslo-wlasciciela-4x'})
    check('po resecie właściciel się loguje', c == 200)

    print('Blokada linku po 5 błędnych hasłach')
    W = 'zgadywanie@przyklad.pl'
    call('rejestracja', {'email': W, 'haslo': 'Prawdziwe-haslo-9', 'zgoda': True})
    kod_w = link(mails(W)[-1], 'potwierdz')
    codes = [page_post('potwierdz', {'t': kod_w, 'haslo': f'zle-{i}-zle'})[0] for i in range(6)]
    c, html = page_post('potwierdz', {'t': kod_w, 'haslo': 'Prawdziwe-haslo-9'})
    check('po 5 błędach link przestaje działać nawet z dobrym hasłem', c == 404, str(codes) + str(c))

    print('Limity rejestracji: na adres (3 wiadomości/dobę) i na IP (5/godz.)')
    sql('DELETE FROM limity')   # liczniki z wcześniejszych testów
    B = 'spam@przyklad.pl'
    codes = [call('rejestracja', {'email': B, 'haslo': f'Haslo-spam-{i}-xx', 'zgoda': True})[0] for i in range(6)]
    check('najwyżej 3 wiadomości na adres', len(mails(B)) == 3, str(len(mails(B))))
    check('5 prób z jednego IP przechodzi, 6. dostaje 429', codes[:5] == [200] * 5 and codes[5] == 429, str(codes))
    sql('DELETE FROM limity')

    print('Limit nieudanych logowań')
    codes = []
    for i in range(10):
        c, *_ = call('logowanie', {'email': EM, 'haslo': f'zle-haslo-{i}'})
        codes.append(c)
    check('po 8 nieudanych próbach → 429', 429 in codes and codes.index(429) <= 8, str(codes))
    c, *_ = call('logowanie', {'email': EM, 'haslo': 'Kolejne-haslo-1'})
    check('… także dla poprawnego hasła (z tego IP)', c == 429)

    print('Usuwanie konta')
    # po blokadzie logowania używamy jeszcze ważnej sesji T3
    c, j, *_ = call('usun', {'haslo': 'zle'}, token=T3)
    check('złe hasło → 403', c == 403)
    c, j, *_ = call('usun', {'haslo': 'Kolejne-haslo-1'}, token=T3)
    check('usunięcie konta', c == 200)
    c, j, *_ = call('ja', token=T3)
    check('sesja po usunięciu nie działa', c == 401)
    left = sql(f"SELECT (SELECT COUNT(*) FROM uzytkownicy WHERE email='{EM}'), (SELECT COUNT(*) FROM postepy), (SELECT COUNT(*) FROM tokeny WHERE uzytkownik_id=1)")[0]
    check('dane użytkownika usunięte z bazy', left == ('0', '0', '0'), str(left))
    row = sql('SELECT haslo_hash FROM uzytkownicy LIMIT 1')
    check('hasła są zahaszowane (argon2id/bcrypt)', row and (row[0][0].startswith('$argon2id$') or row[0][0].startswith('$2y$')))
    content = dump()
    check('w bazie nie ma jawnych haseł ani tokenów', not any(x in content for x in [b'Haslo-wlasciciela-2', b'Kolejne-haslo-1', T3.encode()]))

    print('Różne')
    c, j, *_ = call('nieznana')
    check('nieznana akcja → 404', c == 404)
    c, j, txt, h = call('ja', token='x', headers={'Origin': 'https://localhost'})
    check('CORS dla aplikacji Android', h.get('Access-Control-Allow-Origin') == 'https://localhost')
    c, j, txt, h = call('ja', token='x', headers={'Origin': 'https://zlo.example'})
    check('brak CORS dla obcych stron', h.get('Access-Control-Allow-Origin') is None)
    req = urllib.request.Request(API + '?a=logowanie', method='OPTIONS', headers={'Origin': 'https://localhost', 'Access-Control-Request-Method': 'POST'})
    with urllib.request.urlopen(req) as r:
        check('preflight OPTIONS → 204 z nagłówkami', r.status == 204 and 'X-Edu-Token' in (r.headers.get('Access-Control-Allow-Headers') or ''))
    c, j, txt, h = call('ja', token='x')
    check('nagłówki bezpieczeństwa', h.get('X-Content-Type-Options') == 'nosniff' and h.get('Cache-Control') == 'no-store')
    c, j, *_ = call('logowanie', raw=b'to nie jest json', method='POST')
    check('śmieci zamiast JSON → 401 bez błędu 500', c in (400, 401, 429))
    log = open(os.path.join(TMP, 'srv.log')).read()
    check('brak błędów PHP w logu serwera', 'Fatal' not in log and 'Warning' not in log and 'Deprecated' not in log, log[-400:])

finally:
    srv.terminate()
    shutil.rmtree(TMP, ignore_errors=True)

print(f'\n[{"MySQL" if MYSQL else "SQLite"}] {PASS} testów przeszło, {FAIL} nie przeszło')
sys.exit(1 if FAIL else 0)
