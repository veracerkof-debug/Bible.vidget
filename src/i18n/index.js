// Строки интерфейса: ru (основной), en, id. Тексты нейтральные, без прямого обращения («ты»/«вы»), как в Melete.
import ru from './ru.js'; import en from './en.js'; import id from './id.js';
export const DICTS = { ru, en, id };
export const LANGS = [{ id: 'ru', name: 'Русский' }, { id: 'en', name: 'English' }, { id: 'id', name: 'Bahasa Indonesia' }];
let cur = 'en';
export const getLang = () => cur;
export function setLang(l) { cur = DICTS[l] ? l : 'en'; document.documentElement.lang = cur; }
export function guessLang() { const n = (navigator.language || 'en').slice(0, 2).toLowerCase(); return DICTS[n] ? n : 'en'; }
export function t(key, p) {
  let s = DICTS[cur][key] ?? DICTS.en[key] ?? key;
  if (p) s = s.replace(/\{(\w+)\}/g, (_, k) => (p[k] ?? ''));
  return s;
}
const LOC = { ru: 'ru-RU', en: 'en-US', id: 'id-ID' };
export const fmtDate = (d, opts) => new Intl.DateTimeFormat(LOC[cur], opts).format(typeof d === 'string' ? new Date(d.length === 10 ? d + 'T12:00:00' : d) : d);
export const weekdayLetters = (first) => { // первая буква дня недели, начиная с first
  const base = new Date(2026, 10, 15 + first); // 15.11.2026 — воскресенье
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(base); d.setDate(base.getDate() + i); return new Intl.DateTimeFormat(LOC[cur], { weekday: 'narrow' }).format(d); });
};
