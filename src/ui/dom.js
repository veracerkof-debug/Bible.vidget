// Мелкие помощники интерфейса: создание элементов, значки, шторка (с жестом «смахнуть вниз»), уведомление-тост.
export function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k in el && k !== 'list' && k !== 'type' && typeof v !== 'string') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  add(el, kids);
  return el;
}
function add(el, kids) {
  for (const k of kids.flat(Infinity)) { if (k == null || k === false) continue; el.append(k.nodeType ? k : document.createTextNode(String(k))); }
}
export const $ = (sel, root = document) => root.querySelector(sel);
export const clear = (el) => { while (el.firstChild) el.removeChild(el.firstChild); return el; };
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Значки: контурные, 24×24, толщина 1.8 — в духе Melete
const I = {
  home: '<path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>',
  book: '<path d="M12 6.5C10.5 5.2 8.2 4.6 4 4.6v13.8c4.2 0 6.5.6 8 1.9 1.5-1.3 3.8-1.9 8-1.9V4.6c-4.200 0-6.500.6-8 1.900zM12 6.500v13.800"/>',
  chat: '<path d="M20 12a8 8 0 0 1-11.800 7L4 20l1.100-3.900A8 8 0 1 1 20 12z"/>',
  history: '<path d="M4 12a8 8 0 1 0 2.400-5.700L4 8.500M4 4v4.500h4.500M12 8v4.500l3 1.800"/>',
  user: '<circle cx="12" cy="8" r="3.600"/><path d="M4.800 20a7.200 7.200 0 0 1 14.400 0"/>',
  bell: '<path d="M6 16V11a6 6 0 1 1 12 0v5l1.600 2H4.400zM10 20.500a2 2 0 0 0 4 0"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.400 13.500a7.700 7.700 0 0 0 0-3l2-1.600-2-3.400-2.400 1a7.600 7.600 0 0 0-2.600-1.500L14 2.500h-4l-.4 2.500a7.600 7.600 0 0 0-2.600 1.500l-2.400-1-2 3.400 2 1.600a7.700 7.700 0 0 0 0 3l-2 1.600 2 3.400 2.400-1a7.600 7.600 0 0 0 2.600 1.500l.4 2.500h4l.4-2.500a7.600 7.600 0 0 0 2.600-1.500l2.400 1 2-3.400z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', close: '<path d="M6 6l12 12M18 6L6 18"/>', check: '<path d="M5 12.500l4.500 4.500L19 7.500"/>',
  left: '<path d="M15 5l-7 7 7 7"/>', right: '<path d="M9 5l7 7-7 7"/>', down: '<path d="M5 9l7 7 7-7"/>',
  camera: '<path d="M4 8h3l1.500-2.500h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.500"/>',
  image: '<rect x="4" y="5" width="16" height="14" rx="2"/><circle cx="9" cy="10" r="1.500"/><path d="M5 17l4.500-4.500 3 3L16 12l3 3.500"/>',
  flame: '<path d="M12 3c1 3.500 5 5.500 5 10a5 5 0 0 1-10 0c0-2 1-3.200 2-4.200.2 1.200.8 2 1.700 2.200C10.500 8.500 10.800 5.500 12 3z"/>',
  pray: '<path d="M12 21c-3-1.200-5.500-3-6.500-6l-1-6.500c-.2-1 1.300-1.400 1.700-.4L8 13V6.500c0-1 1.500-1.200 1.700-.2L11 12V4.500c0-1.200 2-1.200 2 0V12l1.300-5.700c.2-1 1.700-.8 1.700.2V13l1.800-4.900c.4-1 1.900-.6 1.700.4l-1 6.500c-1 3-3.500 4.800-6.500 6z"/>',
  cross: '<path d="M12 3v18M6 9h12"/>', send: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  heart: '<path d="M12 20s-7.500-4.500-7.500-10A4.200 4.200 0 0 1 12 7.500 4.200 4.200 0 0 1 19.500 10c0 5.500-7.500 10-7.500 10z"/>',
  calendar: '<rect x="4" y="5.500" width="16" height="14" rx="2"/><path d="M4 10h16M8.500 3.500v4M15.500 3.500v4"/>',
  lock: '<rect x="5" y="10.500" width="14" height="9.500" rx="2"/><path d="M8 10.500V8a4 4 0 0 1 8 0v2.500"/>',
  share: '<path d="M12 15V4M8 8l4-4 4 4M5 13v6h14v-6"/>', trash: '<path d="M5 7h14M9.500 7V4.500h5V7M7 7l.8 12.500h8.400L17 7"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16zM13.500 6.500l4 4"/>', sparkle: '<path d="M12 4l1.800 5.200L19 11l-5.200 1.800L12 18l-1.800-5.200L5 11l5.200-1.800z"/>',
  more: '<circle cx="5.500" cy="12" r="1.200"/><circle cx="12" cy="12" r="1.200"/><circle cx="18.500" cy="12" r="1.200"/>',
  type: '<path d="M4 18L9.500 5.500 15 18M6 14h7M16 18l3.500-8L23 18M17.500 15.500h4"/>', copy: '<rect x="8" y="8" width="11" height="12" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h9"/>',
  mic: '<rect x="9" y="3.500" width="6" height="11" rx="3"/><path d="M5.500 11.500a6.500 6.500 0 0 0 13 0M12 18v3"/>', link: '<path d="M10 14a4 4 0 0 0 5.700 0l3-3a4 4 0 0 0-5.700-5.700l-1 1M14 10a4 4 0 0 0-5.700 0l-3 3a4 4 0 0 0 5.700 5.700l1-1"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14-4M4 5v4h4M4 13a8 8 0 0 0 14 4M20 19v-4h-4"/>', highlight: '<path d="M5 19h6M13.500 5.500l5 5L10 19l-5-1 1-5zM12 7l5 5"/>',
};
export const icon = (name, size = 24, cls = '') => {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('width', size); s.setAttribute('height', size);
  s.setAttribute('class', 'ic ' + cls); s.setAttribute('aria-hidden', 'true');
  s.innerHTML = I[name] || ''; return s;
};

// Шторка снизу. Закрывается: смахнуть вниз за ручку, касание фона, «Назад». full — на весь экран.
// Для каждой шторки в историю добавляется запись, чтобы системная «Назад» закрывала именно её (по одной, сверху вниз).
const stack = []; let skip = 0;
addEventListener('popstate', () => {
  if (skip > 0) { skip--; return; }
  const top = stack[stack.length - 1];
  if (top) top(true, true);
});
// Переход по адресу из шторки: сначала дожидаемся, пока шторка уберёт свою запись из истории (иначе «назад» отменит переход)
export function navigate(hash) {
  const run = () => { location.hash = hash; };
  if (skip > 0) { const f = () => { removeEventListener('popstate', f); run(); }; addEventListener('popstate', f); } else run();
}
export function sheet({ title, body, full = false, onClose, cls = '' }) {
  const back = h('div', { class: 'sh-back' });
  const grab = h('div', { class: 'sh-grab', 'aria-hidden': 'true' }, h('i'));
  const panel = h('div', { class: 'sh ' + (full ? 'full ' : '') + cls, role: 'dialog', 'aria-modal': 'true', 'aria-label': title || '' }, grab, body);
  const wrap = h('div', { class: 'sh-wrap' }, back, panel);
  let closed = false;
  const close = (silent, fromPop) => {
    if (closed) return; closed = true;
    const i = stack.indexOf(close); if (i >= 0) stack.splice(i, 1);
    panel.classList.add('out'); back.classList.add('out');
    setTimeout(() => wrap.remove(), 220);
    if (!fromPop) { skip++; history.back(); }
    if (!silent || fromPop) onClose && onClose();
  };
  history.pushState({ sheet: 1 }, '');
  stack.push(close);
  back.addEventListener('click', () => close());
  // жест: смахнуть вниз
  let y0 = null, dy = 0;
  grab.addEventListener('pointerdown', (e) => { y0 = e.clientY; dy = 0; grab.setPointerCapture(e.pointerId); panel.style.transition = 'none'; });
  grab.addEventListener('pointermove', (e) => { if (y0 == null) return; dy = Math.max(0, e.clientY - y0); panel.style.transform = `translateY(${dy}px)`; });
  const up = () => { if (y0 == null) return; y0 = null; panel.style.transition = ''; if (dy > 90) close(); else panel.style.transform = ''; };
  grab.addEventListener('pointerup', up); grab.addEventListener('pointercancel', up);
  document.body.append(wrap);
  requestAnimationFrame(() => { panel.classList.add('in'); back.classList.add('in'); });
  return { close, el: panel };
}

let toastEl, toastT;
export function toast(msg, ms = 2600) {
  toastEl ??= document.body.appendChild(h('div', { class: 'toast', role: 'status', 'aria-live': 'polite' }));
  toastEl.textContent = msg; toastEl.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('on'), ms);
}
export function confirmSheet({ title, text, ok, cancel, danger = false }) {
  return new Promise((resolve) => {
    let done = false; const fin = (v) => { if (!done) { done = true; resolve(v); } };
    const s = sheet({ title, onClose: () => fin(false), body: h('div', { class: 'sh-body' },
      h('h3', { class: 'sh-title' }, title), text ? h('p', { class: 'muted' }, text) : null,
      h('div', { class: 'col gap' },
        h('button', { class: 'btn ' + (danger ? 'danger' : 'primary'), onclick: () => { fin(true); s.close(true); } }, ok),
        h('button', { class: 'btn ghost', onclick: () => s.close() }, cancel))) });
  });
}
