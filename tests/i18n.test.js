import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { DICTS } from '../src/i18n/index.js';

const walk = (d) => readdirSync(d).flatMap((f) => { const p = d + '/' + f; return statSync(p).isDirectory() ? walk(p) : p.endsWith('.js') ? [p] : []; });
const used = new Set();
walk('src').filter((p) => !p.includes('/i18n/')).forEach((p) => {
  for (const m of readFileSync(p, 'utf8').matchAll(/'((?:common|tab|mk|bn|home|ci|passage|word|chat|hist|an|me|th|wk|nf|onb|app)\.[A-Za-z0-9]+)'/g)) used.add(m[1]);
});
['none', 'posted', 'done'].forEach((k) => used.add('mk.' + k));
['home', 'word', 'chat', 'history', 'me'].forEach((k) => used.add('tab.' + k));
describe('словари', () => {
  it('все ключи кода есть во всех языках', () => {
    for (const [l, d] of Object.entries(DICTS)) { const miss = [...used].filter((k) => !(k in d)); expect(miss, l).toEqual([]); }
  });
  it('языки совпадают по набору ключей', () => {
    const base = Object.keys(DICTS.ru).sort();
    for (const l of ['en', 'id']) expect(Object.keys(DICTS[l]).sort(), l).toEqual(base);
  });
  it('подстановки {…} одинаковы в переводах', () => {
    const ph = (s) => (s.match(/\{\w+\}/g) || []).sort().join();
    for (const k of Object.keys(DICTS.ru)) for (const l of ['en', 'id']) expect(ph(DICTS[l][k]), l + ' ' + k).toBe(ph(DICTS.ru[k]));
  });
});
