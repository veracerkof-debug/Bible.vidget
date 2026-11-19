// Лента пары: отчёты, сообщения, «прочти», стихи, молитвы, заметки. Подтверждение — прямо в карточке.
import { h, icon, sheet, toast, navigate } from '../ui/dom.js';
import { app } from '../app.js';
import { t, getLang, fmtDate } from '../i18n/index.js';
import { refLabel } from '../core/canon.js';
import { passageText, trInfo } from '../core/bible.js';
import { avatar, pairAvatars, lazyImg } from '../ui/parts.js';
import { openCheckinView, openCheckin } from './checkin.js';

export function chat() {
  const el = h('div', { class: 'screen chat' });
  const list = h('div', { class: 'feed' });
  const input = h('input', { class: 'cin', placeholder: t('chat.ph', { name: app.partnerProfile?.name || '…' }), maxlength: 1000, enterkeyhint: 'send', 'aria-label': t('chat.msg'),
    onkeydown: (e) => { if (e.key === 'Enter') send(); }, oninput: () => { sendBtn.disabled = !input.value.trim(); } });
  const sendBtn = h('button', { class: 'sendb', disabled: true, 'aria-label': t('home.send'), onclick: send }, icon('send', 22));
  const bell = h('button', { class: 'ibtn round', 'aria-label': t('home.nudge'), onclick: () => { if (!app.partner) return; toast(app.nudge() ? t('home.nudged', { name: app.partnerProfile.name }) : t('home.nudgeWait')); } }, icon('bell', 22));
  const hd = h('div', { class: 'hd chathd' }, pairAvatars(34), h('div', { class: 'grow' }, h('b', { class: 'ell' }, app.partnerProfile ? t('home.pair', { name: app.partnerProfile.name }) : t('home.alone')), h('div', { class: 'muted small' }, t('chat.members', { n: app.model.logins.length || 1 }))), bell);
  const comp = h('div', { class: 'comp' }, h('button', { class: 'ibtn', 'aria-label': t('chat.more'), onclick: quick }, icon('plus', 22)), input, sendBtn);
  el.append(hd, list, comp);
  function send() { const v = input.value.trim(); if (!v || !app.partner) return; app.sendEvent('msg', { text: v }); input.value = ''; sendBtn.disabled = true; }
  function quick() {
    const s = sheet({ title: t('chat.more'), body: h('div', { class: 'sh-body' }, h('h3', { class: 'sh-title' }, t('chat.more')),
      h('button', { class: 'li btn-li', onclick: () => { s.close(true); navigate('#/word'); } }, icon('book', 22), h('div', { class: 'grow' }, t('chat.sendVerse'))),
      h('button', { class: 'li btn-li', onclick: () => { s.close(true); app.sendEvent('prayer', { text: '' }); toast(t('home.sent')); } }, icon('pray', 22), h('div', { class: 'grow' }, t('home.prayer'))),
      h('button', { class: 'li btn-li', onclick: () => { s.close(true); openCheckin(); } }, icon('camera', 22), h('div', { class: 'grow' }, t('ci.title')))) });
  }
  function draw() {
    const m = app.model; const items = [];
    Object.values(m.checkins).forEach((byDay) => Object.values(byDay).forEach((c) => items.push({ k: 'ci', at: c.at || c.date, by: c.by, c })));
    m.events.forEach((e) => { if (['msg', 'nudge', 'verse', 'prayer', 'note', 'anniv'].includes(e.type)) items.push({ k: 'ev', at: e.at || e.id, by: e.by, e }); });
    items.sort((a, b) => String(a.at).localeCompare(String(b.at)));
    const nearBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 120 || !list.childElementCount;
    list.replaceChildren(...(items.length ? [] : [h('p', { class: 'muted center pad' }, t('chat.empty'))]));
    let lastDay = '';
    items.forEach((it) => {
      const day = String(it.at).slice(0, 10);
      if (day !== lastDay) { lastDay = day; list.append(h('div', { class: 'dsep' }, fmtDate(day, { day: 'numeric', month: 'long' }))); }
      list.append(it.k === 'ci' ? ciItem(it) : evItem(it));
    });
    if (nearBottom) requestAnimationFrame(() => { list.scrollTop = list.scrollHeight; });
  }
  const who = (u) => (u === app.me ? t('home.you') : app.profile(u).name);
  function ackLine(author, key) {
    const ok = app.model.isAcked(author, key), mine = author === app.me;
    if (ok) return h('div', { class: 'ackrow ok' }, icon('check', 16), t(mine ? 'ci.confirmedBy' : 'ci.confirmed', { name: app.partnerProfile?.name || '' }));
    if (mine) return h('div', { class: 'ackrow' }, t('ci.waiting', { name: app.partnerProfile?.name || '' }));
    return h('button', { class: 'btn primary sm', onclick: () => { app.ack(author, key); toast(t('ci.confirmedToast')); } }, icon('check', 16), t('ci.confirm'));
  }
  function ciItem({ c, by }) {
    return h('div', { class: 'msg card ' + (by === app.me ? 'mine' : '') },
      h('div', { class: 'mh' }, avatar(by, 28), h('b', {}, who(by)), h('span', { class: 'muted small' }, t('chat.read'))),
      c.photo ? h('button', { class: 'mph', onclick: () => openCheckinView(by, c.date) }, lazyImg(c.photo, 'cimg')) : null,
      h('button', { class: 'refbtn', onclick: () => openCheckinView(by, c.date) }, icon('book', 18), refLabel(c.ref, getLang(), false)),
      c.text ? h('p', { class: 'refl' }, c.text) : null, ackLine(by, 'c-' + c.date));
  }
  function evItem({ e, by }) {
    const mine = by === app.me;
    if (e.type === 'msg') return h('div', { class: 'bub ' + (mine ? 'mine' : '') }, e.text);
    if (e.type === 'nudge') return h('div', { class: 'sys' }, icon('bell', 16), t('chat.nudged', { name: who(by) }));
    if (e.type === 'prayer') return h('div', { class: 'msg card ' + (mine ? 'mine' : '') }, h('div', { class: 'mh' }, avatar(by, 28), h('b', {}, who(by)), h('span', { class: 'muted small' }, t('chat.prayer'))), e.text ? h('p', { class: 'refl' }, e.text) : h('div', { class: 'pray' }, icon('pray', 28)));
    if (e.type === 'anniv') return h('div', { class: 'sys' }, icon('heart', 16), t('chat.anniv', { name: who(by), title: e.title }));
    if (e.type === 'verse' || e.type === 'note') {
      const body = h('p', { class: 'quote' }, '…');
      const tr = app.translation; passageText(tr, e.ref).then((x) => { body.textContent = x; }).catch(() => { body.textContent = ''; });
      return h('div', { class: 'msg card ' + (mine ? 'mine' : '') },
        h('div', { class: 'mh' }, avatar(by, 28), h('b', {}, who(by)), h('span', { class: 'muted small' }, t(e.type === 'verse' ? 'chat.verse' : 'chat.note'))),
        body, h('div', { class: 'qref' }, refLabel(e.ref, getLang(), false) + ' · ' + trInfo(tr).name),
        e.type === 'note' ? [h('p', { class: 'refl' }, e.text), ackLine(by, 'e-' + e.id)] : null);
    }
    return h('div');
  }
  draw();
  return { el, update: draw };
}
