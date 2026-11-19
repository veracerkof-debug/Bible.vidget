// История: статистика пары и календарь месяца (две отметки на день). Касание дня — отчёты этого дня.
import { h, icon, sheet } from '../ui/dom.js';
import { app } from '../app.js';
import { t, getLang, fmtDate, weekdayLetters } from '../i18n/index.js';
import { monthGrid, monthKey, addMonths } from '../core/dates.js';
import { pairAvatars } from '../ui/parts.js';
import { openCheckinView } from './checkin.js';

export function history(initialDay) {
  const el = h('div', { class: 'screen hist' });
  let mk = monthKey(initialDay || app.today);
  const mark = (st, d) => h('i', { class: 'mk ' + st + (st === 'none' && d < app.today ? ' miss' : '') }, st === 'done' ? icon('check', 10) : st === 'posted' ? h('b') : null);
  function render() {
    const m = app.model, grid = monthGrid(mk, app.weekFirst), letters = weekdayLetters(app.weekFirst);
    const pp = app.partnerProfile;
    const cal = h('div', { class: 'cal' }, ...letters.map((l) => h('div', { class: 'cw' }, l)), ...grid.map((d) => !d ? h('div') :
      h('button', { class: 'cd' + (d === app.today ? ' today' : '') + (d > app.today ? ' fut' : ''), onclick: () => day(d) },
        h('div', { class: 'mks' }, mark(m.dayState(app.me, d), d), mark(app.partner ? m.dayState(app.partner, d) : 'none', d)), h('span', {}, +d.slice(8)))));
    el.replaceChildren(
      h('div', { class: 'hd' }, pairAvatars(40), h('div', { class: 'grow' }, h('b', { class: 'hd-t' }, pp ? t('home.pair', { name: pp.name }) : t('home.alone')),
        h('div', { class: 'muted small' }, m.since ? t('hist.since', { d: fmtDate(m.since, { month: 'long', year: 'numeric' }) }) : ''))),
      h('div', { class: 'stats' }, stat(m.stats.books, t('hist.books')), stat(m.stats.chapters, t('hist.chapters')), stat(m.streak.weeks, t('hist.weeks')), stat(m.streak.weekStreak, t('hist.wkStreak')), stat(m.streak.together, t('hist.streak')), stat(m.streak.best, t('hist.best'))),
      h('div', { class: 'mnav' }, h('b', {}, fmtDate(mk + '-01', { month: 'long', year: 'numeric' })), h('div', { class: 'row gap' },
        h('button', { class: 'ibtn round', 'aria-label': t('hist.prev'), onclick: () => { mk = addMonths(mk, -1); render(); } }, icon('left', 20)),
        h('button', { class: 'ibtn round', 'aria-label': t('hist.next'), disabled: mk >= monthKey(app.today), onclick: () => { mk = addMonths(mk, 1); render(); } }, icon('right', 20)))),
      cal, h('p', { class: 'muted small legend' }, h('span', { class: 'lg' }, mark('done', ''), t('mk.done')), h('span', { class: 'lg' }, mark('posted', ''), t('mk.posted')), h('span', { class: 'lg' }, mark('none', ''), t('mk.none'))));
  }
  const stat = (n, l) => h('div', { class: 'stat' }, h('b', {}, n), h('span', {}, l));
  function day(d) {
    const items = [app.me, app.partner].filter(Boolean).filter((u) => app.model.checkins[u]?.[d]);
    if (!items.length) { const s = sheet({ title: d, body: h('div', { class: 'sh-body' }, h('h3', { class: 'sh-title' }, fmtDate(d, { weekday: 'long', day: 'numeric', month: 'long' })), h('p', { class: 'muted' }, t('hist.none'))) }); return s; }
    if (items.length === 1) return openCheckinView(items[0], d);
    const s = sheet({ title: d, body: h('div', { class: 'sh-body' }, h('h3', { class: 'sh-title' }, fmtDate(d, { weekday: 'long', day: 'numeric', month: 'long' })),
      ...items.map((u) => h('button', { class: 'li btn-li', onclick: () => { s.close(true); openCheckinView(u, d); } }, h('div', { class: 'grow' }, h('b', {}, u === app.me ? t('home.you') : app.profile(u).name)), icon('right', 18)))) });
    return s;
  }
  render();
  if (initialDay && initialDay <= app.today) setTimeout(() => day(initialDay), 50);
  return { el, update: render };
}
