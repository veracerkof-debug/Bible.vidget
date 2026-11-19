// Отчёт о чтении: фото (необязательно), что читали, рефлексия. Партнёр должен подтвердить.
import { h, icon, sheet, toast, navigate } from '../ui/dom.js';
import { app } from '../app.js';
import { t, getLang } from '../i18n/index.js';
import { refLabel } from '../core/canon.js';
import { toJpeg } from '../core/image.js';
import { pickPassage } from './passage.js';
import { P } from '../core/model.js';

export function openCheckin({ suggest } = {}) {
  const old = app.checkinOf(app.me);
  let ref = old?.ref || null, photo = null, photoUrl = null;
  const sug = suggest || (app.cfg.lastRead ? { b: app.cfg.lastRead.b, c: app.cfg.lastRead.c } : null);
  const photoBox = h('button', { class: 'ph-box', 'aria-label': t('ci.photo'), onclick: () => cam.click() });
  const cam = h('input', { type: 'file', accept: 'image/*', capture: 'user', hidden: true, onchange: (e) => take(e.target.files[0]) });
  const gal = h('input', { type: 'file', accept: 'image/*', hidden: true, onchange: (e) => take(e.target.files[0]) });
  const drawPhoto = () => {
    photoBox.replaceChildren();
    if (photoUrl) photoBox.append(h('img', { src: photoUrl, alt: '' }));
    else photoBox.append(h('div', { class: 'ph-empty' }, icon('camera', 34), h('span', {}, t('ci.photo'))));
  };
  async function take(f) { if (!f) return; try { photo = await toJpeg(f); photoUrl = URL.createObjectURL(photo); drawPhoto(); } catch { toast(t('ci.photoErr')); } }
  if (old?.photo) app.photoURL(old.photo).then((u) => { if (u && !photoUrl) { photoUrl = u; drawPhoto(); } });
  drawPhoto();

  const passBtn = h('button', { class: 'chip big', onclick: () => pickPassage({ current: ref, onPick: (r) => { ref = r; drawRef(); } }) });
  const sugEl = h('div', { class: 'muted small sugg' });
  const drawRef = () => {
    passBtn.replaceChildren(icon(ref ? 'book' : 'plus', 18), ref ? refLabel(ref, getLang(), false) : t('ci.addPassage'));
    sugEl.replaceChildren();
    if (!ref && sug) sugEl.append(t('ci.reading', { ref: refLabel(sug, getLang(), false) }) + ' ', h('button', { class: 'lnk', onclick: () => { ref = sug; drawRef(); } }, t('ci.useIt')));
    post.disabled = !ref;
  };
  const text = h('textarea', { class: 'ta', rows: 5, placeholder: t('ci.reflPh'), maxlength: 2000 }, old?.text || '');
  const post = h('button', { class: 'btn primary lg', onclick: () => {
    if (!ref) return;
    app.postCheckin({ ref, text: text.value, photo });
    toast(t(old ? 'ci.saved' : 'ci.posted')); s.close(true); app.emit();
  } }, old ? t('ci.save') : t('ci.post'));

  const body = h('div', { class: 'sh-body tall ci' },
    h('div', { class: 'row' }, h('button', { class: 'ibtn', 'aria-label': t('common.close'), onclick: () => s.close() }, icon('close')), h('h3', { class: 'sh-title grow' }, t('ci.title'))),
    photoBox, h('div', { class: 'row center gap' }, h('button', { class: 'lnk', onclick: () => gal.click() }, t('ci.gallery')), photo || old?.photo ? h('button', { class: 'lnk', onclick: () => cam.click() }, t('ci.retake')) : null),
    h('div', { class: 'cap' }, t('ci.passage')), passBtn, sugEl,
    h('div', { class: 'cap' }, t('ci.reflection')), text,
    h('p', { class: 'muted small' }, t('ci.partnerSees', { name: app.partnerProfile?.name || '…' })),
    h('div', { class: 'grow' }), post, cam, gal);
  const s = sheet({ title: t('ci.title'), body, full: true });
  drawRef();
  return s;
}

// Просмотр отчёта (свой или партнёра): фото, проход, рефлексия, подтверждение
export function openCheckinView(author, date) {
  const c = app.model.checkins[author]?.[date]; if (!c) return;
  const mine = author === app.me; const key = 'c-' + date;
  const acked = app.model.isAcked(author, key);
  const who = app.profile(author);
  const body = h('div', { class: 'sh-body tall' });
  const draw = () => {
    const ok = app.model.isAcked(author, key);
    body.replaceChildren(
      h('div', { class: 'row' }, h('h3', { class: 'sh-title grow' }, `${who.name} · ${new Intl.DateTimeFormat(getLang(), { day: 'numeric', month: 'long' }).format(new Date(date + 'T12:00:00'))}`), h('button', { class: 'ibtn', 'aria-label': t('common.close'), onclick: () => s.close() }, icon('close'))),
      c.photo ? h('div', { class: 'ph-view' }, viewImg(c.photo)) : null,
      h('div', { class: 'ref-line' }, icon('book', 18), refLabel(c.ref, getLang(), false), h('button', { class: 'lnk', onclick: () => { s.close(true); navigate('#/word/' + c.ref.b + '.' + c.ref.c); } }, t('ci.read'))),
      c.text ? h('p', { class: 'refl' }, c.text) : null,
      h('div', { class: 'ackrow ' + (ok ? 'ok' : '') }, ok ? [icon('check', 18), t(mine ? 'ci.confirmedBy' : 'ci.confirmed', { name: app.partnerProfile?.name || '' })] : [mine ? t('ci.waiting', { name: app.partnerProfile?.name || '' }) : null]),
      !mine && !ok ? h('button', { class: 'btn primary lg', onclick: () => { app.ack(author, key); toast(t('ci.confirmedToast')); draw(); } }, icon('check', 20), t('ci.confirm')) : null,
      mine ? h('button', { class: 'btn ghost', onclick: () => { s.close(true); if (date === app.today) openCheckin(); } }, icon('edit', 18), t('ci.edit')) : null);
  };
  const s = sheet({ title: t('ci.title'), body });
  draw();
  void acked;
}
const viewImg = (path) => { const i = h('img', { alt: '' }); app.photoURL(path).then((u) => { if (u) i.src = u; }); return i; };
export { P };
