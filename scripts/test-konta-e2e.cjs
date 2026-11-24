// Test end-to-end kont: prawdziwa aplikacja (dist/) + prawdziwy serwer PHP z bazą SQLite + przeglądarka.
// Użycie: npm run build && node scripts/test-konta-e2e.cjs
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 8098;
const BASE = `http://127.0.0.1:${PORT}`;
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'konta-e2e-'));
const WWW = path.join(TMP, 'www');
const MAIL = path.join(TMP, 'mail');
fs.mkdirSync(MAIL, { recursive: true });
fs.cpSync(path.join(ROOT, 'dist'), path.join(WWW, 'aplikacja'), { recursive: true });
fs.cpSync(path.join(ROOT, 'deploy/api'), path.join(WWW, 'api'), { recursive: true });
fs.cpSync(path.join(ROOT, 'landing/fonts'), path.join(WWW, 'fonts'), { recursive: true });
for (const f of ['legal.css', 'regulamin.html', 'polityka-prywatnosci.html']) fs.copyFileSync(path.join(ROOT, 'landing', f), path.join(WWW, f));
fs.copyFileSync(path.join(ROOT, 'deploy/poczta.php'), path.join(WWW, 'poczta.php'));
fs.writeFileSync(path.join(WWW, 'zapis-ustawienia.php'), `<?php return ['nadawca'=>'kontakt@edukwadrat.pl','nadawca_nazwa'=>'EduKwadrat','adres_strony'=>'${BASE}','smtp_haslo'=>''];`);
fs.writeFileSync(path.join(WWW, 'konto-ustawienia.php'), `<?php return ['db_dsn'=>'sqlite:${TMP}/konta.sqlite'];`);

let pass = 0, fail = 0;
const check = (name, cond, info = '') => { if (cond) { pass++; console.log('  ok  ', name); } else { fail++; console.log('  FAIL', name, info); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const lastMailTo = (to) => {
  const files = fs.readdirSync(MAIL).sort();
  for (const f of files.reverse()) { const t = fs.readFileSync(path.join(MAIL, f), 'utf8'); if (t.startsWith(`Do: ${to}`)) return t; }
  return null;
};
const link = (mail, a) => (mail.match(new RegExp(`(http[^\\s]*a=${a}&t=[a-f0-9]{64})`)) || [])[1];
const ls = (page, key) => page.evaluate((k) => localStorage.getItem(`etutor:v1:default:${k}`), key);
const progressOf = async (page) => JSON.parse((await ls(page, 'progress')) || '{}');

(async () => {
  const srv = spawn('php', ['-S', `127.0.0.1:${PORT}`, '-t', WWW], { env: { ...process.env, EDUKWADRAT_TEST_MAIL_DIR: MAIL, PHP_CLI_SERVER_WORKERS: '4' }, stdio: ['ignore', fs.openSync(path.join(TMP, 'srv.log'), 'w'), fs.openSync(path.join(TMP, 'srv.log'), 'a')] });
  await sleep(1200);
  const browser = await chromium.launch();
  const EM = 'rodzic@przyklad.pl', PW = 'Bezpieczne-haslo-42';
  try {
    // ---------- urządzenie A ----------
    const ctxA = await browser.newContext();
    const A = await ctxA.newPage();
    const errs = [];
    A.on('pageerror', (e) => errs.push(e.message));
    // przeglądarka loguje też celowe odpowiedzi 400/401 z testów (słabe hasło, złe hasło) – to nie błędy aplikacji
    A.on('console', (m) => { if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) errs.push(m.text()); });
    // postępy zebrane przed założeniem konta (bez logowania)
    await A.goto(`${BASE}/aplikacja/`);
    await A.evaluate(() => localStorage.setItem('etutor:v1:default:progress', JSON.stringify({
      attempts: [{ ts: 1000, topicId: 'dodawanie', difficulty: 1, correct: true, score: 1, hints: 0, source: 'lesson' }],
      lessons: { 'przyklad-1': { stars: 3, ts: 2000 } }, studySeconds: { '2026-11-20': 600 },
    })));
    await A.goto(`${BASE}/aplikacja/#/ustawienia`);
    await A.reload();
    check('w ustawieniach jest karta Konto', await A.getByRole('heading', { name: 'Konto' }).isVisible());
    await A.getByRole('link', { name: /Zaloguj się lub załóż konto/ }).click();
    await A.getByRole('heading', { name: 'Konto', level: 1 }).waitFor();
    check('ekran konta otwiera się', true);

    console.log('Rejestracja i potwierdzenie');
    await A.getByRole('radio', { name: 'Załóż konto' }).click();
    await A.getByLabel('Adres e-mail').fill(EM);
    await A.getByLabel('Hasło', { exact: true }).fill('12345678');
    await A.getByRole('checkbox').check();
    await A.getByRole('button', { name: 'Załóż konto' }).click();
    await A.getByRole('alert').waitFor();
    check('słabe hasło jest odrzucone z komunikatem', /łatwe do odgadnięcia/.test(await A.getByRole('alert').innerText()));
    await A.getByLabel('Hasło', { exact: true }).fill(PW);
    await A.getByRole('checkbox').uncheck();
    await A.getByRole('button', { name: 'Załóż konto' }).click();
    check('bez zgody: komunikat', /Zaznacz/.test(await A.getByRole('alert').innerText()));
    await A.getByRole('checkbox').check();
    await A.getByRole('button', { name: 'Załóż konto' }).click();
    await A.getByText('Sprawdź skrzynkę').waitFor();
    check('rejestracja: komunikat o wiadomości', true);
    const m1 = lastMailTo(EM);
    check('e-mail z linkiem potwierdzającym dotarł', !!m1 && !!link(m1, 'potwierdz'));

    await A.getByLabel('Hasło', { exact: true }).fill(PW);
    await A.getByRole('button', { name: 'Zaloguj się' }).click();
    await A.getByText('Twoje konto').waitFor();
    check('logowanie przed potwierdzeniem działa', (await A.locator('body').innerText()).includes(EM));
    check('widać prośbę o potwierdzenie adresu', await A.getByText('nie jest jeszcze potwierdzony').isVisible());

    const P = await ctxA.newPage();
    await P.goto(link(m1, 'potwierdz'));
    await P.getByLabel('Hasło do konta').fill('zle-haslo-xyz');
    await P.getByRole('button', { name: 'Potwierdzam' }).click();
    check('potwierdzenie ze złym hasłem odrzucone', await P.getByText('Hasło jest nieprawidłowe').isVisible());
    await P.getByLabel('Hasło do konta').fill(PW);
    await P.getByRole('button', { name: 'Potwierdzam' }).click();
    check('strona potwierdza konto po wpisaniu hasła', await P.getByText('Konto potwierdzone').isVisible());
    await P.close();
    await A.getByRole('button', { name: 'Synchronizuj teraz' }).click();
    await A.getByText('Adres e-mail potwierdzony').waitFor({ timeout: 15000 });
    check('aplikacja widzi potwierdzenie adresu', true);

    console.log('Synchronizacja: A → serwer');
    await A.getByText(/zsynchronizowane o/).waitFor({ timeout: 15000 });
    check('postępy zsynchronizowane', true);
    const tokenA = JSON.parse(await ls(A, 'account')).token;
    const srv1 = await (await fetch(`${BASE}/api/index.php?a=postepy`, { headers: { 'X-Edu-Token': tokenA } })).json();
    check('serwer ma lekcję i próbę z urządzenia A', srv1.dane?.lessons?.['przyklad-1']?.stars === 3 && srv1.dane.attempts.length === 1 && srv1.wersja >= 1, JSON.stringify(srv1).slice(0, 200));
    check('puste obiekty na serwerze to {} a nie []', !Array.isArray(srv1.dane.badges) && !Array.isArray(srv1.dane.topicMeta));

    // ---------- urządzenie B (czyste) ----------
    console.log('Urządzenie B');
    const ctxB = await browser.newContext();
    const B = await ctxB.newPage();
    B.on('pageerror', (e) => errs.push(e.message));
    await B.goto(`${BASE}/aplikacja/#/konto`);
    await B.getByLabel('Adres e-mail').fill(EM);
    await B.getByLabel('Hasło', { exact: true }).fill('zle-haslo-123');
    await B.getByRole('button', { name: 'Zaloguj się' }).click();
    await B.getByRole('alert').waitFor();
    check('złe hasło: komunikat', /Nieprawidłowy e-mail lub hasło/.test(await B.getByRole('alert').innerText()));
    await B.getByLabel('Hasło', { exact: true }).fill(PW);
    await B.getByRole('button', { name: 'Zaloguj się' }).click();
    await B.getByText(/zsynchronizowane o/).waitFor({ timeout: 20000 });
    const pB = await progressOf(B);
    check('B dostało postępy z konta (lekcja, próba, czas nauki)', pB.lessons?.['przyklad-1']?.stars === 3 && pB.attempts?.length === 1 && pB.studySeconds?.['2026-11-20'] === 600, JSON.stringify(pB).slice(0, 200));

    console.log('Synchronizacja: B → serwer → A (automatycznie)');
    await B.goto(`${BASE}/aplikacja/#/cwicz/mix`);
    // próba zapisuje się po zakończeniu zadania, więc odpowiadamy błędnie, aż aplikacja ją zapisze (zadanie wpisywane albo wybieralne)
    const attemptsBefore = (await progressOf(B)).attempts.length;
    await B.locator('.answer-input, .choice').first().waitFor({ timeout: 15000 });
    for (let i = 0; i < 8 && (await progressOf(B)).attempts.length === attemptsBefore; i++) {
      if (await B.locator('.answer-input:not([disabled])').count()) {
        await B.locator('.answer-input').first().fill('987654');
        await B.keyboard.press('Enter');
      } else if (await B.locator('.choice:not([disabled])').count()) {
        await B.locator('.choice:not([disabled])').first().click();
        await B.getByRole('button', { name: /Sprawdź/ }).click();
      }
      await sleep(600);
    }
    await sleep(500);
    const attemptsB = (await progressOf(B)).attempts.length;
    check('B zapisało nową próbę lokalnie', attemptsB > attemptsBefore, `${attemptsBefore} → ${attemptsB}`);
    console.log('  (czekam do 80 s na automatyczną synchronizację – limit: raz na minutę)');
    let srv2;
    const t0 = Date.now();
    const tokenB = JSON.parse(await ls(B, 'account')).token;
    while (Date.now() - t0 < 80000) {
      srv2 = await (await fetch(`${BASE}/api/index.php?a=postepy`, { headers: { 'X-Edu-Token': tokenB } })).json();
      if (srv2.dane.attempts.length >= attemptsB && attemptsB > attemptsBefore) break;
      await sleep(3000);
    }
    check('nowa próba z B trafiła na serwer sama', srv2.dane.attempts.length >= attemptsB, `${srv2.dane.attempts.length} vs ${attemptsB}`);
    check('… razem ze starymi danymi z A', srv2.dane.lessons['przyklad-1'].stars === 3 && srv2.dane.attempts.some((a) => a.ts === 1000));

    await A.getByRole('button', { name: 'Synchronizuj teraz' }).click();
    await sleep(2500);
    const pA = await progressOf(A);
    check('A po synchronizacji ma próbę zrobioną na B', pA.attempts.length === srv2.dane.attempts.length, `${pA.attempts.length} vs ${srv2.dane.attempts.length}`);

    console.log('Wylogowanie i inne konto na tym samym urządzeniu');
    await A.getByRole('button', { name: 'Wyloguj', exact: true }).click();
    await A.getByRole('radio', { name: 'Zaloguj się' }).waitFor();
    check('po wylogowaniu pokazuje się formularz', true);
    check('token usunięty z urządzenia', (await ls(A, 'account')) === null);
    check('postępy zostają na urządzeniu po wylogowaniu', (await progressOf(A)).lessons['przyklad-1'].stars === 3);
    const after = await fetch(`${BASE}/api/index.php?a=ja`, { headers: { 'X-Edu-Token': tokenA } });
    check('token po wylogowaniu nie działa na serwerze', after.status === 401);

    // drugie konto (inne dziecko/rodzic) na tym samym urządzeniu nie dziedziczy cudzych postępów
    const EM2 = 'inny@przyklad.pl';
    await A.getByRole('radio', { name: 'Załóż konto' }).click();
    await A.getByLabel('Adres e-mail').fill(EM2);
    await A.getByLabel('Hasło', { exact: true }).fill(PW);
    await A.getByRole('checkbox').check();
    await A.getByRole('button', { name: 'Załóż konto' }).click();
    await A.getByText('Sprawdź skrzynkę').waitFor();
    await A.getByLabel('Hasło', { exact: true }).fill(PW);
    await A.getByRole('button', { name: 'Zaloguj się' }).click();
    await A.getByText('Twoje konto').waitFor();
    await sleep(1500);
    const pA2 = await progressOf(A);
    check('inne konto zaczyna od zera (nie dostaje cudzych postępów)', !pA2.lessons || Object.keys(pA2.lessons).length === 0, JSON.stringify(pA2).slice(0, 150));

    console.log('Reset hasła w przeglądarce');
    const C = await (await browser.newContext()).newPage();
    await C.goto(`${BASE}/aplikacja/#/konto`);
    await C.getByRole('button', { name: 'Nie pamiętam hasła' }).click();
    await C.getByLabel('Adres e-mail').fill(EM);
    await C.getByRole('button', { name: 'Wyślij link' }).click();
    await C.getByText(/Jeśli konto z tym adresem istnieje/).waitFor();
    const mr = lastMailTo(EM);
    const reset = link(mr, 'reset');
    check('e-mail z linkiem do zmiany hasła dotarł', !!reset);
    await C.goto(reset);
    await C.getByLabel('Nowe hasło').fill('Zupelnie-nowe-haslo-7');
    await C.getByLabel('Powtórz hasło').fill('Zupelnie-nowe-haslo-7');
    await C.getByRole('button', { name: 'Zmień hasło' }).click();
    check('hasło zmienione', await C.getByText('Hasło zmienione').isVisible());
    await C.goto(`${BASE}/aplikacja/#/konto`);
    await C.getByLabel('Adres e-mail').fill(EM);
    await C.getByLabel('Hasło', { exact: true }).fill('Zupelnie-nowe-haslo-7');
    await C.getByRole('button', { name: 'Zaloguj się' }).click();
    await C.getByText('Twoje konto').waitFor();
    check('logowanie nowym hasłem działa', true);
    const sB = await fetch(`${BASE}/api/index.php?a=ja`, { headers: { 'X-Edu-Token': tokenB } });
    check('reset hasła wylogował urządzenie B', sB.status === 401);

    console.log('Usunięcie konta');
    await C.getByRole('button', { name: 'Usuń konto' }).click();
    await C.getByLabel('Wpisz hasło, żeby potwierdzić').fill('zle');
    await C.getByRole('button', { name: 'Usuń konto na stałe' }).click();
    await C.getByRole('alert').waitFor();
    check('złe hasło nie usuwa konta', /nieprawidłowe/.test(await C.getByRole('alert').innerText()));
    await C.getByLabel('Wpisz hasło, żeby potwierdzić').fill('Zupelnie-nowe-haslo-7');
    await C.getByRole('button', { name: 'Usuń konto na stałe' }).click();
    await C.getByRole('radio', { name: 'Zaloguj się' }).waitFor({ timeout: 15000 });
    check('po usunięciu konta aplikacja wraca do logowania', true);

    check('brak błędów JavaScript w konsoli', errs.length === 0, errs.join(' | ').slice(0, 300));
    const log = fs.readFileSync(path.join(TMP, 'srv.log'), 'utf8');
    check('brak błędów PHP w logu serwera', !/Fatal|Warning|Deprecated/.test(log), log.slice(-300));
  } catch (e) {
    fail++;
    console.log('  FAIL wyjątek:', e.message.split('\n')[0]);
  } finally {
    await browser.close();
    srv.kill();
    fs.rmSync(TMP, { recursive: true, force: true });
  }
  console.log(`\n${pass} testów przeszło, ${fail} nie przeszło`);
  process.exit(fail ? 1 : 0);
})();
