// Импорт текстов Библии (запускается вручную, результат лежит в репозитории):
//   node tools/import-bible.mjs <id перевода> <путь к *_vpl.txt>
// Источник — eBible.org («<id>_vpl.zip»). Формат строки: «GEN 1:1 текст».
// Пишет public/bible/<id>/<КОД>.json — массив глав, глава — массив стихов (текст без нумерации).
// Пример: node tools/import-bible.mjs kjv eng-kjv2006_vpl.txt
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { BOOKS } from '../src/core/canon.js';

const [id, src] = process.argv.slice(2);
if (!id || !src) { console.error('нужны: id перевода и путь к *_vpl.txt'); process.exit(1); }
const by = {};
readFileSync(src, 'utf8').split('\n').forEach((line) => {
  const m = /^(\w{3}) (\d+):(\d+) (.*)$/.exec(line.trim());
  if (!m) return;
  const [, b, c, v, text] = m;
  ((by[b] ??= [])[+c - 1] ??= [])[+v - 1] = text.trim().replace(/\s+/g, ' ');
});
mkdirSync('public/bible/' + id, { recursive: true });
let verses = 0; const diffs = [];
BOOKS.forEach((bk) => {
  const ch = by[bk.code];
  if (!ch) throw new Error('нет книги ' + bk.code);
  const clean = ch.map((vs) => (vs || []).map((x) => x || ''));
  verses += clean.reduce((n, c) => n + c.length, 0);
  if (clean.length !== bk.chapters) diffs.push(bk.code + ': ' + clean.length + ' гл. вместо ' + bk.chapters);
  writeFileSync('public/bible/' + id + '/' + bk.code + '.json', JSON.stringify(clean));
});
console.log(id + ': ' + BOOKS.length + ' книг, ' + verses + ' стихов' + (diffs.length ? '; расхождения глав: ' + diffs.join('; ') : ''));
