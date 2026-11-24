// Renderuje reel EduKwadrat do MP4 (1080×1920, 30 kl./s).
// Użycie:
//   node promo/reel/renderuj.cjs podglad 0.5 3.6 9.5 ...   → klatki PNG do sprawdzenia
//   node promo/reel/renderuj.cjs film wyjscie.mp4 ["Tekst przycisku"]
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const FPS = 30, DUR = 25;
const SCENA = 'file://' + path.join(__dirname, process.env.SCENA || 'scena.html');   // SCENA=scena-rodzice.html
const LOGO = fs.readFileSync(path.join(__dirname, '../../logo/e2-znak.svg'), 'utf8')
  .replace(/width="\d+" height="\d+"/, 'width="100%" height="100%"')
  .replace('fill="#000"', 'fill="#17223a"');

async function otworz(cta) {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await p.addInitScript((svg) => { window.LOGO_SVG = svg; }, LOGO);
  await p.goto(SCENA + (cta ? '?cta=' + encodeURIComponent(cta) : ''));
  await p.evaluate(() => window.ready);
  return { b, p };
}

(async () => {
  const [tryb, ...args] = process.argv.slice(2);
  if (tryb === 'podglad') {
    const out = process.env.OUT || '.';
    const { b, p } = await otworz();
    for (const t of args.map(Number)) {
      await p.evaluate((t) => window.render(t), t);
      await p.screenshot({ path: path.join(out, `klatka-${t.toFixed(2)}.png`) });
    }
    await b.close();
    return;
  }
  if (tryb === 'film') {
    const [plik, cta] = args;
    const { b, p } = await otworz(cta);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', plik], { stdio: ['pipe', 'inherit', 'inherit'] });
    const N = FPS * DUR;
    for (let i = 0; i < N; i++) {
      await p.evaluate((t) => window.render(t), i / FPS);
      const buf = await p.screenshot({ type: 'jpeg', quality: 95 });
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
      if (i % 150 === 0) process.stdout.write(`klatka ${i}/${N}\n`);
    }
    ff.stdin.end();
    await new Promise((r) => ff.on('close', r));
    await b.close();
    console.log('gotowe:', plik);
  }
})();
