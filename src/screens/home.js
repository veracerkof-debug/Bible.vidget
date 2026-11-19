// Главная: серии, неделя, действия (памятный день, молитва, «прочти»), сегодняшние отчёты двоих.
import { h, icon, toast, sheet } from '../ui/dom.js';
import { app } from '../app.js';
import { t, getLang, fmtDate, weekdayLetters } from '../i18n/index.js';
import { weekDays, nextAnnivIn } from '../core/dates.js';
import { refLabel } from '../core/canon.js';
import { avatar, pairAvatars, lazyImg } from '../ui/parts.js';
import { openCheckin, openCheckinView } from './checkin.js';
import { openAnniv } from './anniv.js';

const mark = (st, past) => h('i', { class: 'mk ' + st + (st === 'none' && past ? ' miss' : ''), 'aria-label': t('mk.' + st) }, st === 'done' ? icon('check', 11) : st === 'posted' ? h('b') : null);

export function home() {
  const el = h('div', { class: 'screen home' });
  function render() {
    const m = app.model, me = app.me, pr = app.partner;
    const pp = app.partnerProfile;
    const days = weekDays(app.today, app.weekFirst), letters = weekdayLetters(app.weekFirst);
    const strip = h('div', { class: 'week' }, ...days.map((d, i) => h('div', { class: 'wd' + (d === app.today ? ' today' : '') + (d > app.today ? ' fut' : ''), onclick: () => { location.hash = '#/history/' + d; } },
      h('span', { class: 'wl' }, letters[i]), h('div', { class: 'mks' }, mark(m.dayState(me, d), d < app.today), mark(pr ? m.dayState(pr, d) : 'none', d < app.today)), h('s'))));
    const up = m.anniversaries.map((a) => ({ a, n: nextAnnivIn(a.date, app.today) })).sort((x, y) => x.n - y.n)[0];
    const anniv = h('button', { class: 'pillbtn grow', onclick: () => openAnniv() },
      up && up.n <= 45 ? [icon('heart', 20), h('span', { class: 'ell' }, up.a.title), h('em', {}, up.n === 0 ? t('home.today') : t('home.inDays', { n: up.n }))] : [icon('plus', 20), h('span', { class: 'ell' }, t('home.anniv'))]);
    const prayer = h('button', { class: 'pillbtn round', 'aria-label': t('home.prayer'), onclick: askPrayer }, icon('pray', 22));
    const nudge = h('button', { class: 'pillbtn dark', disabled: !pr, onclick: () => doNudge() }, icon('bell', 20), h('span', { class: 'ell' }, pp ? pp.name : '…'));
    el.replaceChildren(
      h('div', { class: 'hd' },
        h('button', { class: 'hd-l', onclick: () => { location.hash = '#/me'; }, 'aria-label': t('tab.me') }, pairAvatars(38), h('span', { class: 'hd-t ell' }, pp ? t('home.pair', { name: pp.name }) : t('home.alone'))),
        h('div', { class: 'streaks' }, h('div', {}, t('home.together'), h('b', {}, icon('flame', 18, 'fl'), m.streak.together)), h('div', {}, t('home.you'), h('b', {}, icon('flame', 18, 'fl'), m.streak.me)))),
      strip,
      h('div', { class: 'acts' }, anniv, prayer, nudge),
      h('div', { class: 'date' }, fmtDate(app.today, { weekday: 'long', day: 'numeric', month: 'long' })),
      pr ? cards() : invite());
  }
  function cards() {
    const mine = app.checkinOf(app.me), theirs = app.checkinOf(app.partner);
    const pp = app.partnerProfile;
    const card = (who, c, own) => {
      const name = own ? t('home.you') : pp.name;
      const st = c ? (app.model.isAcked(who, 'c-' + app.today) ? 'done' : 'posted') : 'none';
      const face = c ? [c.photo ? lazyImg(c.photo, 'cimg') : h('div', { class: 'cref' }, icon('book', 26), refLabel(c.ref, getLang(), true)), h('div', { class: 'cav' }, avatar(who, 34)),
        h('div', { class: 'cst ' + st }, st === 'done' ? icon('check', 14) : st === 'posted' ? (own ? t('mk.wait') : t('mk.confirm')) : null)]
        : [h('div', { class: 'cnone' }, icon(own ? 'plus' : 'bell', 36))];
      return h('button', { class: 'cci ' + (own ? 'mine' : 'theirs') + (c ? ' has' : ''), onclick: () => { if (c) openCheckinView(who, app.today); else if (own) openCheckin(); else doNudge(); }, 'aria-label': name },
        h('div', { class: 'cface' }, ...face), h('div', { class: 'cname ell' }, name));
    };
    return h('div', { class: 'cards' }, card(app.me, mine, true), card(app.partner, theirs, false));
  }
  const invite = () => h('div', { class: 'empty' }, h('p', {}, t('home.waitPartner')), h('button', { class: 'btn primary', onclick: () => { location.hash = '#/me'; } }, t('home.invite')));
  function doNudge() { if (!app.partner) return; toast(app.nudge() ? t('home.nudged', { name: app.partnerProfile.name }) : t('home.nudgeWait')); }
  function askPrayer() {
    const ta = h('textarea', { class: 'ta', rows: 4, maxlength: 500, placeholder: t('home.prayerPh') });
    const s = sheet({ title: t('home.prayer'), body: h('div', { class: 'sh-body' }, h('h3', { class: 'sh-title' }, t('home.prayer')), ta,
      h('button', { class: 'btn primary lg', onclick: () => { app.sendEvent('prayer', { text: ta.value.trim() }); s.close(true); toast(t('home.sent')); } }, t('home.send'))) });
    setTimeout(() => ta.focus(), 250);
  }
  render();
  return { el, update: render };
}
