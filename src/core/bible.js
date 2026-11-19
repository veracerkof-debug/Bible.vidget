// Тексты Библии: public/bible/<перевод>/<КОД>.json — массив глав, глава — массив стихов. Лежат в приложении, кэшируются сервис-воркером.
import { TRANSLATIONS } from './canon.js';
const cache = new Map();
export function loadBook(tr, code) {
  const key = tr + '/' + code;
  if (!cache.has(key)) {
    const url = new URL(`bible/${tr}/${code}.json`, document.baseURI).href;
    cache.set(key, fetch(url).then((r) => { if (!r.ok) throw new Error('bible ' + key + ' ' + r.status); return r.json(); }).catch((e) => { cache.delete(key); throw e; }));
  }
  return cache.get(key);
}
export async function chapterText(tr, code, ch) { const b = await loadBook(tr, code); return b[ch - 1] || []; }
// Текст прохода для цитаты: «16 Ибо так возлюбил Бог мир…» — несколько стихов с номерами
export async function passageText(tr, ref) {
  const vs = await chapterText(tr, ref.b, ref.c);
  if (!ref.v1) return vs.join(' ');
  const a = ref.v1, z = ref.v2 || ref.v1;
  const part = vs.slice(a - 1, z);
  return part.map((x, i) => (part.length > 1 ? (a + i) + ' ' : '') + x).join(' ');
}
export const trInfo = (id) => TRANSLATIONS.find((x) => x.id === id) || TRANSLATIONS[1];
