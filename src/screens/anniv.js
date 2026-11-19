// Памятные дни пары: список, добавление, удаление. Повторяются каждый год; в день события приходит уведомление.
import { h, icon, sheet, confirmSheet } from '../ui/dom.js';
import { app } from '../app.js';
import { t, fmtDate } from '../i18n/index.js';
import { nextAnnivIn } from '../core/dates.js';

export function openAnniv() {
  const listEl = h('div', {});
  const title = h('input', { class: 'inp', placeholder: t('an.titlePh'), maxlength: 60 });
  const date = h('input', { class: 'inp', type: 'date', value: app.today });
  const draw = () => {
    const list = app.model.anniversaries.map((a) => ({ a, n: nextAnnivIn(a.date, app.today) })).sort((x, y) => x.n - y.n);
    listEl.replaceChildren(list.length ? h('div', { class: 'list' }, ...list.map(({ a, n }) => h('div', { class: 'li' }, icon('heart', 20, 'fl'),
      h('div', { class: 'grow' }, h('b', {}, a.title), h('div', { class: 'muted small' }, fmtDate(a.date, { day: 'numeric', month: 'long', year: 'numeric' }) + ' · ' + (n === 0 ? t('home.today') : t('home.inDays', { n })))),
      h('button', { class: 'ibtn', 'aria-label': t('common.delete'), onclick: async () => { if (await confirmSheet({ title: t('an.del'), ok: t('common.delete'), cancel: t('common.cancel'), danger: true })) app.delAnniv(a.id); } }, icon('trash', 20))))) : h('p', { class: 'muted' }, t('an.empty')));
  };
  const body = h('div', { class: 'sh-body' }, h('h3', { class: 'sh-title' }, t('an.title')), listEl, h('div', { class: 'cap' }, t('an.add')), title, date,
    h('button', { class: 'btn primary lg', onclick: () => { if (!title.value.trim() || !date.value) return; app.addAnniv({ title: title.value.trim(), date: date.value }); title.value = ''; } }, t('an.save')));
  const off = app.on(draw);
  const s = sheet({ title: t('an.title'), body, onClose: off });
  draw();
  return s;
}
