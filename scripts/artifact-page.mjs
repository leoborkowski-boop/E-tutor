// Zamienia samodzielny build (dist-artifact/index.html) na treść strony do publikacji
// jako Artifact na claude.ai: platforma sama dodaje <!doctype>, <html>, <head> i <body>.
import { readFileSync, writeFileSync } from 'node:fs';

const src = readFileSync('dist-artifact/index.html', 'utf8');
const head = src.slice(src.indexOf('<head>') + 6, src.indexOf('</head>'));
const body = src.slice(src.indexOf('<body>') + 6, src.lastIndexOf('</body>'));
const cleanedHead = head
  .replace(/<meta charset[^>]*>/, '')
  .replace(/<meta name="viewport"[^>]*>/, '')
  .replace(/<meta name="theme-color"[^>]*>/, '')
  .replace(/<title>[^<]*<\/title>/, '')
  .replace(/<link rel="icon" href="[^"]*"\s*\/?>/, '');
writeFileSync('dist-artifact/e-tutor.html', `<title>E-tutor</title>\n${cleanedHead.trim()}\n${body.trim()}\n`);
console.log('dist-artifact/e-tutor.html');
