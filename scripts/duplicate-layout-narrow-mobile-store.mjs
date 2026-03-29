/**
 * Appends html.layout-narrow clones of @media (max-width: 900px) rules in
 * mobile-app-store.css so narrow layout applies when viewport width is wrong.
 * Run: node scripts/duplicate-layout-narrow-mobile-store.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(__dirname, '../src/components/styles/mobile-app-store.css');
let css = fs.readFileSync(file, 'utf8');

const mediaOpen = '@media (max-width: 900px) {';
const tabletMedia = '\n@media (max-width: 900px) and (min-width: 769px)';
const dupMarker = '\n\n/* Duplicated for html.layout-narrow when viewport width lies (Opera GX, etc.) */';

const dupStart = css.indexOf(dupMarker);
if (dupStart !== -1) {
  const dupEnd = css.indexOf(tabletMedia, dupStart);
  if (dupEnd !== -1) {
    css = css.slice(0, dupStart) + css.slice(dupEnd);
  }
}

const mi = css.indexOf(mediaOpen);
const ti = css.indexOf(tabletMedia);
if (mi === -1 || ti === -1 || ti <= mi) {
  console.error('Expected media blocks not found');
  process.exit(1);
}

let depth = 0;
let i = mi + mediaOpen.length;
const bodyStart = i;
for (; i < ti; i++) {
  const c = css[i];
  if (c === '{') depth++;
  else if (c === '}') {
    if (depth === 0) break;
    depth--;
  }
}
const inner = css.slice(bodyStart, i).trimEnd();

/** @param {string} s */
function parseRules(s) {
  const rules = [];
  let p = 0;
  const len = s.length;
  while (p < len) {
    while (p < len && /\s/.test(s[p])) p++;
    if (p >= len) break;
    if (s[p] === '/' && s[p + 1] === '*') {
      p = s.indexOf('*/', p) + 2;
      continue;
    }
    const selStart = p;
    while (p < len && s[p] !== '{') p++;
    if (p >= len) break;
    const selector = s.slice(selStart, p).trim();
    p++;
    let d = 1;
    const bodyStartIdx = p;
    while (p < len && d > 0) {
      if (s[p] === '{') d++;
      else if (s[p] === '}') d--;
      p++;
    }
    const body = s.slice(bodyStartIdx, p - 1);
    if (selector) rules.push({ selector, body });
  }
  return rules;
}

const rules = parseRules(inner);
let out = `${dupMarker}\n`;
for (const { selector, body } of rules) {
  const trimmed = body.trim();
  const block = trimmed ? `${trimmed}\n` : '';
  if (selector === ':root') {
    out += `html.layout-narrow {\n  ${block.replace(/\n/g, '\n  ')}}\n\n`;
  } else {
    const sel = selector
      .split(',')
      .map((s) => `html.layout-narrow ${s.trim()}`)
      .join(',\n');
    out += `${sel} {\n  ${block.replace(/\n/g, '\n  ')}}\n\n`;
  }
}

const insertAt = css.indexOf(tabletMedia);
if (insertAt === -1) {
  console.error('Tablet media block not found');
  process.exit(1);
}
const newCss = css.slice(0, insertAt) + out + css.slice(insertAt);

fs.writeFileSync(file, newCss);
console.log('Wrote', rules.length, 'rule groups to', path.relative(process.cwd(), file));
