// Библия: чтение главы, выбор перевода, выделение стихов, заметки, «поделиться стихом», переход к отчёту.
// Основа — модуль Библии Melete (книги, тексты, стиль чтения); здесь добавлены общие с партнёром действия.
import { h, icon, sheet, toast } from '../ui/dom.js';
import { app } from '../app.js';
import { t, getLang } from '../i18n/index.js';
import { BOOKS, bookOf, bookName, refLabel, translationsFor, TRANSLATIONS, versesLabel } from '../core/canon.js';
import { loadBook, trInfo } from '../core/bible.js';
import { pickPassage } from './passage.js';
import { openCheckin } from './checkin.js';

const COLORS = { y: '#E9C46A', g: '#9CC59A', b: '#8FB8D9', p: '#E3A6B8' };

export function word(initial) {
  const el = h('div', { class: 'screen word' });
  let cur = initial || app.cfg.lastRead || { b: 'JOH', c: 1 };
  let sel = new Set(); let verses = []; let fs = app.cfg.fs || 19;
  const tr = () => app.translation;
  const head = h('div', { class: 'whead' });
  const text = h('div', { class: 'wtext', style: { fontSize: fs + 'px' }, tabindex: -1 });
  const bar = h('div', { class: 'selbar', hidden: true });
  el.append(head, text, bar);

  const drawHead = () => head.replaceChildren(
    h('div', { class: 'chips' },
      h('button', { class: 'chip', onclick: () => pickPassage({ current: cur, onPick: (r) => go({ b: r.b, c: r.c }) }) }, bookName(cur.b, getLang(), false) + ' ' + cur.c),
      h('button', { class: 'chip', onclick: pickTr }, trInfo(tr()).name)),
    h('div', { class: 'row gap' }, h('button', { class: 'ibtn', 'aria-label': t('word.size'), onclick: sizeSheet }, icon('type', 22))));
  async function go(r, scroll = true) {
    cur = r; sel.clear(); drawBar(); drawHead();
    app.save({ lastRead: { b: r.b, c: r.c } });
    text.replaceChildren(h('p', { class: 'muted center' }, '…'));
    try {
      const book = await loadBook(tr(), r.b);
      if (cur !== r) return;
      verses = book[r.c - 1] || [];
      drawText();
    } catch { text.replaceChildren(h('div', { class: 'fail' }, h('p', {}, t('word.fail')), h('button', { class: 'btn', onclick: () => go(r) }, t('common.retry')))); }
    if (scroll) text.scrollTop = 0;
    history.replaceState(null, '', '#/word/' + r.b + '.' + r.c);
  }
  function drawText() {
    const hl = app.model.highlights[app.me] || {};
    const notes = new Set(app.model.events.filter((e) => e.type === 'note' && e.ref?.b === cur.b && e.ref.c === cur.c).flatMap((e) => range(e.ref.v1, e.ref.v2 || e.ref.v1)));
    const para = h('p', { class: 'wp' });
    verses.forEach((v, i) => {
      const n = i + 1, color = hl[`${cur.b}.${cur.c}.${n}`];
      para.append(h('span', { class: 'v' + (sel.has(n) ? ' sel' : '') + (color ? ' hl' : '') + (notes.has(n) ? ' hasnote' : ''), style: color ? { '--hl': COLORS[color] } : null, onclick: () => pick(n) }, h('sup', {}, n), v + ' '));
    });
    const bk = bookOf(cur.b); const idx = BOOKS.indexOf(bk);
    const prev = prevOf(), next = nextOf();
    text.replaceChildren(para, h('div', { class: 'wend' },
      h('button', { class: 'btn', disabled: !prev, onclick: () => prev && go(prev) }, icon('left', 18), t('word.prev')),
      h('button', { class: 'btn primary', onclick: () => openCheckin({ suggest: { b: cur.b, c: cur.c } }) }, icon('camera', 18), t('word.checkin')),
      h('button', { class: 'btn', disabled: !next, onclick: () => next && go(next) }, t('word.next'), icon('right', 18))));
    void idx;
  }
  const range = (a, z) => { const o = []; for (let i = a || 0; i <= (z || 0); i++) o.push(i); return o; };
  const prevOf = () => cur.c > 1 ? { b: cur.b, c: cur.c - 1 } : (BOOKS.indexOf(bookOf(cur.b)) > 0 ? { b: BOOKS[BOOKS.indexOf(bookOf(cur.b)) - 1].code, c: BOOKS[BOOKS.indexOf(bookOf(cur.b)) - 1].chapters } : null);
  const nextOf = () => { const b = bookOf(cur.b); return cur.c < b.chapters ? { b: cur.b, c: cur.c + 1 } : (BOOKS[BOOKS.indexOf(b) + 1] ? { b: BOOKS[BOOKS.indexOf(b) + 1].code, c: 1 } : null); };
  function pick(n) { sel.has(n) ? sel.delete(n) : sel.add(n); drawText(); drawBar(); }
  const refOfSel = () => { const vs = [...sel].sort((a, b) => a - b); return { b: cur.b, c: cur.c, v1: vs[0], v2: vs.at(-1) }; };
  function drawBar() {
    bar.hidden = sel.size === 0; if (!sel.size) return;
    const vs = [...sel].sort((a, b) => a - b);
    const quote = () => vs.map((n) => (vs.length > 1 ? n + ' ' : '') + verses[n - 1]).join(' ') + '\n— ' + bookName(cur.b, getLang()) + ' ' + cur.c + ':' + versesLabel(vs) + ' (' + trInfo(tr()).name + ')';
    const allHl = vs.every((n) => (app.model.highlights[app.me] || {})[`${cur.b}.${cur.c}.${n}`]);
    bar.replaceChildren(
      h('div', { class: 'selref' }, bookName(cur.b, getLang(), true) + ' ' + cur.c + ':' + versesLabel(vs)),
      h('div', { class: 'selrow' },
        ...Object.entries(COLORS).map(([k, c]) => h('button', { class: 'dot', style: { background: c }, 'aria-label': t('word.hl'), onclick: () => hlAll(vs, k) })),
        allHl ? h('button', { class: 'ibtn', 'aria-label': t('word.unhl'), onclick: () => hlAll(vs, null) }, icon('close', 20)) : null,
        h('button', { class: 'ibtn', 'aria-label': t('word.note'), onclick: () => noteSheet(vs) }, icon('edit', 22)),
        h('button', { class: 'ibtn', 'aria-label': t('word.send'), disabled: !app.partner, onclick: () => { app.sendEvent('verse', { ref: refOfSel(), tr: tr() }); toast(t('word.sent', { name: app.partnerProfile.name })); clearSel(); } }, icon('heart', 22)),
        h('button', { class: 'ibtn', 'aria-label': t('word.copy'), onclick: async () => { try { await navigator.clipboard.writeText(quote()); toast(t('word.copied')); } catch { toast(quote()); } clearSel(); } }, icon('copy', 22)),
        h('button', { class: 'ibtn', 'aria-label': t('common.close'), onclick: clearSel }, icon('down', 22))));
  }
  function clearSel() { sel.clear(); drawText(); drawBar(); }
  function hlAll(vs, color) { vs.forEach((n) => app.setHighlight(`${cur.b}.${cur.c}.${n}`, color)); clearSel(); }
  function noteSheet(vs) {
    const ta = h('textarea', { class: 'ta', rows: 5, maxlength: 1000, placeholder: t('word.notePh') });
    const ref = refOfSel();
    const s = sheet({ title: t('word.note'), body: h('div', { class: 'sh-body' }, h('h3', { class: 'sh-title' }, refLabel(ref, getLang(), false)), ta,
      h('p', { class: 'muted small' }, t('word.noteSee', { name: app.partnerProfile?.name || '…' })),
      h('button', { class: 'btn primary lg', onclick: () => { if (!ta.value.trim()) return; app.sendEvent('note', { ref, tr: tr(), text: ta.value.trim() }); s.close(true); clearSel(); toast(t('word.noteSaved')); } }, t('common.save'))) });
    setTimeout(() => ta.focus(), 250);
  }
  function pickTr() {
    const body = h('div', { class: 'sh-body' }, h('h3', { class: 'sh-title' }, t('word.translation')));
    const s = sheet({ title: t('word.translation'), body });
    const order = [getLang(), ...['ru', 'en', 'id'].filter((l) => l !== getLang())];
    order.forEach((l) => translationsFor(l).forEach((x) => body.append(h('button', { class: 'li btn-li' + (x.id === tr() ? ' on' : ''), onclick: () => { app.save({ translation: x.id }); s.close(true); go(cur, false); } },
      h('div', { class: 'grow' }, h('b', {}, x.name), h('div', { class: 'muted small' }, x.full)), x.id === tr() ? icon('check', 20) : null))));
    body.append(h('p', { class: 'muted small' }, t('word.licenseNote')));
  }
  function sizeSheet() {
    const val = h('b', {}, fs + ''); const r = h('input', { type: 'range', min: 15, max: 30, step: 1, value: fs, class: 'range', 'aria-label': t('word.size'), oninput: (e) => { fs = +e.target.value; text.style.fontSize = fs + 'px'; val.textContent = fs; app.save({ fs }); } });
    sheet({ title: t('word.size'), body: h('div', { class: 'sh-body' }, h('h3', { class: 'sh-title' }, t('word.size'), ' ', val), r) });
  }
  // жест: смахнуть влево/вправо — следующая/предыдущая глава (не от самого края: там системное «Назад»)
  let x0 = null, y0 = null;
  text.addEventListener('touchstart', (e) => { const p = e.touches[0]; x0 = p.clientX > 28 && p.clientX < innerWidth - 28 ? p.clientX : null; y0 = p.clientY; }, { passive: true });
  text.addEventListener('touchend', (e) => {
    if (x0 == null) return; const p = e.changedTouches[0]; const dx = p.clientX - x0, dy = p.clientY - y0; x0 = null;
    if (Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy) * 2.2) { const n = dx < 0 ? nextOf() : prevOf(); if (n) go(n); }
  }, { passive: true });
  go(cur, true);
  return { el, update: () => { if (verses.length && !sel.size) drawText(); }, open: (r) => go(r) };
}
export { TRANSLATIONS };
