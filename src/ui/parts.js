// Общие части экранов: аватар, картинка из репозитория, переключатель, поле.
import { h, icon } from './dom.js';
import { app } from '../app.js';

export function lazyImg(path, cls = '', alt = '') {
  const img = h('img', { class: cls, alt, draggable: 'false', loading: 'lazy' });
  app.photoURL(path).then((u) => { if (u) { img.src = u; img.classList.add('ld'); } });
  return img;
}
export function avatar(login, size = 40) {
  const p = app.profile(login);
  const el = h('span', { class: 'av', style: { width: size + 'px', height: size + 'px', fontSize: Math.round(size * 0.42) + 'px', background: p.color || 'var(--tint)' }, 'aria-hidden': 'true' }, (p.name || '?').trim().slice(0, 1).toUpperCase());
  if (p.avatar) app.photoURL(p.avatar).then((u) => { if (u) { el.textContent = ''; el.style.backgroundImage = `url(${u})`; el.classList.add('img'); } });
  return el;
}
export function pairAvatars(size = 40) {
  const w = h('span', { class: 'avpair', style: { width: size * 1.6 + 'px', height: size * 1.15 + 'px' } });
  w.append(avatar(app.me, size)); if (app.partner) w.append(avatar(app.partner, size));
  return w;
}
export const row = (...k) => h('div', { class: 'row' }, ...k);
export function segmented(options, value, onChange, cls = '') {
  const el = h('div', { class: 'seg ' + cls, role: 'tablist' });
  options.forEach(([v, label]) => el.append(h('button', { role: 'tab', 'aria-selected': String(v === value), class: v === value ? 'on' : '', onclick: () => onChange(v) }, label)));
  return el;
}
export const toggle = (on, onChange, label) => h('button', { class: 'sw' + (on ? ' on' : ''), role: 'switch', 'aria-checked': String(!!on), 'aria-label': label || '', onclick: (e) => { const n = !e.currentTarget.classList.contains('on'); e.currentTarget.classList.toggle('on', n); e.currentTarget.setAttribute('aria-checked', String(n)); onChange(n); } }, h('i'));
export { icon };
