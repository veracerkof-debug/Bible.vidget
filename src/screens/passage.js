// Выбор прохода: книга → глава (одна или диапазон). Возвращает { b, c, c2? } через колбэк.
import { h, icon, sheet } from '../ui/dom.js';
import { BOOKS, bookName } from '../core/canon.js';
import { t, getLang } from '../i18n/index.js';

export function pickPassage({ onPick, current }) {
  const body = h('div', { class: 'sh-body tall' });
  let s;
  const books = () => {
    body.replaceChildren(h('h3', { class: 'sh-title' }, t('passage.title')));
    for (const [label, nt] of [[t('passage.ot'), false], [t('passage.nt'), true]]) {
      body.append(h('div', { class: 'cap' }, label));
      body.append(h('div', { class: 'bgrid' }, ...BOOKS.filter((b) => b.nt === nt).map((b) =>
        h('button', { class: 'bk' + (current?.b === b.code ? ' on' : ''), onclick: () => chapters(b) }, bookName(b.code, getLang(), true)))));
    }
  };
  const chapters = (b) => {
    let from = null;
    const grid = h('div', { class: 'cgrid' });
    // кнопки не пересоздаются при касании: иначе двойное касание («одна глава») не доходит до второго нажатия
    const btns = Array.from({ length: b.chapters }, (_, i) => i + 1).map((c) => h('button', { class: 'bk', onclick: () => {
      if (from == null) { from = c; hint.textContent = t('passage.to'); btns[c - 1].classList.add('on'); }
      else { const [a, z] = from <= c ? [from, c] : [c, from]; s.close(true); onPick(a === z ? { b: b.code, c: a } : { b: b.code, c: a, c2: z }); }
    } }, String(c)));
    grid.append(...btns);
    const hint = h('p', { class: 'muted small hint' }, t('passage.hint'));
    body.replaceChildren(h('div', { class: 'row' }, h('button', { class: 'ibtn', 'aria-label': t('common.back'), onclick: books }, icon('left')), h('h3', { class: 'sh-title grow' }, bookName(b.code, getLang()))), hint, grid);
  };
  s = sheet({ title: t('passage.title'), body, full: true });
  books();
  return s;
}
