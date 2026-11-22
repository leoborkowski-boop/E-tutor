// Zrzuty strony sprzedażowej (zasada 13 z landing/DESIGN.md).
// Użycie: python3 -m http.server -d landing 8088  &&  node scripts/landing-screenshots.cjs [katalog]
const { chromium } = require('playwright');
const out = process.argv[2] || 'landing-shots';
require('fs').mkdirSync(out, { recursive: true });
(async () => {
  const b = await chromium.launch();
  for (const [name, w, h, scheme] of [['komputer', 1366, 900, 'light'], ['telefon', 390, 844, 'light'], ['komputer-ciemny', 1366, 900, 'dark'], ['telefon-ciemny', 390, 844, 'dark']]) {
    const p = await b.newPage({ viewport: { width: w, height: h }, colorScheme: scheme });
    const errors = [];
    p.on('pageerror', (e) => errors.push(e.message));
    await p.goto(process.env.LANDING_URL || 'http://localhost:8088/', { waitUntil: 'networkidle' });
    await p.screenshot({ path: `${out}/${name}.png`, fullPage: true });
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    console.log(`${name}: ${overflow ? 'UWAGA: strona przewija się w bok' : 'ok'}${errors.length ? ' · błędy: ' + errors.join(' | ') : ''}`);
  }
  await b.close();
})();
