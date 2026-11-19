// Логика уведомлений (чистые функции, tests/notify.test.js). Запускается в GitHub Actions репозитория данных.
// Кому и что отправить — решают только файлы репозитория: сервера у приложения нет.
import { refLabel } from '../src/core/canon.js';
export const LANGS = ['ru', 'en', 'id'];
const S = {
  ru: {
    nudge: (n) => [n, 'Время читать Библию 📖'], verse: (n, d) => [n, 'Стих для вдохновения: ' + d], prayer: (n) => [n, 'Просит молитвы 🙏'],
    msg: (n, d) => [n, d], note: (n) => [n, 'Добавлено заметку к стиху'], checkin: (n, d) => [n, 'Прочитано: ' + d + '. Нужно подтверждение'],
    ack: (n) => [n, 'Отчёт подтверждён ✓'], remind: () => ['Время читать', 'Сегодня отчёта ещё нет'], anniv: (n, d) => ['Памятный день', d],
  },
  en: {
    nudge: (n) => [n, 'Time to read the Bible 📖'], verse: (n, d) => [n, 'A verse for you: ' + d], prayer: (n) => [n, 'Asked for prayer 🙏'],
    msg: (n, d) => [n, d], note: (n) => [n, 'Added a note on a verse'], checkin: (n, d) => [n, 'Read ' + d + '. Waiting for your confirmation'],
    ack: (n) => [n, 'Confirmed your check-in ✓'], remind: () => ['Time to read', 'No check-in yet today'], anniv: (n, d) => ['Special day', d],
  },
  id: {
    nudge: (n) => [n, 'Saatnya membaca Alkitab 📖'], verse: (n, d) => [n, 'Ayat untukmu: ' + d], prayer: (n) => [n, 'Meminta doa 🙏'],
    msg: (n, d) => [n, d], note: (n) => [n, 'Menambahkan catatan pada ayat'], checkin: (n, d) => [n, 'Membaca ' + d + '. Menunggu konfirmasimu'],
    ack: (n) => [n, 'Laporanmu dikonfirmasi ✓'], remind: () => ['Saatnya membaca', 'Hari ini belum ada laporan'], anniv: (n, d) => ['Hari spesial', d],
  },
};
const say = (lang, kind, ...a) => { const [title, body] = (S[lang] || S.en)[kind](...a); return { title, body: String(body).slice(0, 140) }; };
export const refText = (ref, lang = 'en') => refLabel(ref, lang, false);

// added: пути файлов, добавленных в этом пуше; read(path) → JSON | null; members: { логин: профиль }
export function planFromAdded(added, read, members) {
  const out = [];
  const logins = Object.keys(members);
  for (const path of added) {
    const m = /^u\/([^/]+)\/(c|a|e)\/([^/]+)\.json$/.exec(path);
    if (!m) continue;
    const [, from, kind] = m;
    const data = read(path); if (!data) continue;
    const to = logins.filter((l) => l !== from);
    const name = members[from]?.name || from;
    for (const target of to) {
      const lang = members[target]?.lang || 'en';
      let msg = null;
      if (kind === 'c') msg = say(lang, 'checkin', name, data.ref ? refText(data.ref, lang) : '');
      else if (kind === 'a') msg = say(lang, 'ack', name);
      else if (kind === 'e') {
        if (['nudge', 'prayer', 'note'].includes(data.type)) msg = say(lang, data.type, name);
        else if (data.type === 'verse') msg = say(lang, 'verse', name, refText(data.ref, lang));
        else if (data.type === 'msg') msg = say(lang, 'msg', name, data.text || '');
      }
      if (msg) out.push({ to: target, ...msg, tag: kind + '-' + from, url: kind === 'e' && data.type === 'msg' ? '#/chat' : '#/home' });
    }
  }
  return out;
}

export function localParts(date, tz) {
  try {
    const f = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' });
    const p = Object.fromEntries(f.formatToParts(date).map((x) => [x.type, x.value]));
    return { date: `${p.year}-${p.month}-${p.day}`, hour: +p.hour };
  } catch { return localParts(date, 'UTC'); }
}

// Напоминание «время читать» (в выбранный час по поясу получателя, если отчёта за сегодня нет) и памятные дни (в 8 утра)
export function planScheduled({ now, members, hasCheckin, annivs = [] }) {
  const out = [];
  for (const [login, p] of Object.entries(members)) {
    const lp = localParts(now, p.tz || 'UTC'); const lang = p.lang || 'en';
    if (p.remind?.on && lp.hour === (p.remind.hour ?? 20) && !hasCheckin(login, lp.date)) out.push({ to: login, ...say(lang, 'remind'), tag: 'remind', url: '#/home' });
    if (lp.hour === 8) annivs.forEach((a) => { if (a.date && a.date.slice(5) === lp.date.slice(5)) out.push({ to: login, ...say(lang, 'anniv', '', a.title || ''), tag: 'anniv-' + a.id, url: '#/home' }); });
  }
  return out;
}
