import './styles/tokens.css'; import './styles/base.css'; import './styles/app.css';
import { h, icon, clear, toast } from './ui/dom.js';
import { app } from './app.js';
import { t, setLang } from './i18n/index.js';
import { home } from './screens/home.js';
import { word } from './screens/word.js';
import { chat } from './screens/chat.js';
import { history as historyScreen } from './screens/history.js';
import { me } from './screens/me.js';
import { onboarding } from './screens/onboarding.js';

const root = document.getElementById('app');
const TABS = [['home', 'home'], ['word', 'book'], ['chat', 'chat'], ['history', 'history'], ['me', 'user']];
const SCREENS = { home, word, chat, history: historyScreen, me };
let cur = null, curName = null, shell = null;

const pendingAcks = () => {
  const m = app.model; if (!m || !app.partner) return 0;
  let n = Object.keys(m.checkins[app.partner] || {}).filter((d) => !m.isAcked(app.partner, 'c-' + d)).length;
  n += m.events.filter((e) => e.by === app.partner && e.type === 'note' && !m.isAcked(app.partner, 'e-' + e.id)).length;
  return n;
};
function parseHash() { const [, name = 'home', ...rest] = location.hash.split('/'); return { name, rest }; }

function mountShell() {
  clear(root);
  const view = h('main', { class: 'view', id: 'view' });
  const banner = h('div', { class: 'banner', hidden: true, role: 'status' });
  const bar = h('nav', { class: 'tabbar', 'aria-label': 'Tabs' });
  root.append(banner, view, bar);
  shell = { view, bar, banner };
  route();
}
function drawBar() {
  const n = pendingAcks();
  shell.bar.replaceChildren(...TABS.map(([id, ic]) => h('a', { href: '#/' + id, class: 'tab' + (id === curName ? ' on' : ''), 'aria-label': t('tab.' + id), 'aria-current': id === curName ? 'page' : null }, icon(ic, 24), id === 'chat' && n ? h('b', { class: 'badge' }, n > 9 ? '9+' : String(n)) : null)));
}
function drawBanner() {
  const s = app.repo?.status || {}; const q = app.repo?.queue.length || 0;
  const msg = s.authError ? t('bn.auth') : s.offline && q ? t('bn.offline', { n: q }) : '';
  shell.banner.hidden = !msg; shell.banner.textContent = msg;
  shell.banner.onclick = s.authError ? () => { location.hash = '#/me'; } : null;
}
function route() {
  if (!shell) return;
  let { name, rest } = parseHash();
  if (!SCREENS[name]) name = 'home';
  curName = name;
  const arg = name === 'word' && rest[0] ? (() => { const [b, c] = rest[0].split('.'); return { b, c: +c || 1 }; })() : name === 'history' ? rest[0] : undefined;
  cur = SCREENS[name](arg);
  clear(shell.view).append(cur.el);
  shell.view.scrollTop = 0; shell.view.className = 'view v-' + name;
  drawBar(); drawBanner();
}

async function start() {
  setLang(app.cfg.lang);
  const ok = await app.boot();
  const { name, rest } = parseHash();
  if (!ok) {
    // ссылка-приглашение: #/join/<владелец>/<репозиторий>/<токен>; токен сразу убираем из адреса и истории
    const join = name === 'join' && rest.length >= 3 ? { owner: rest[0], repo: rest[1], token: decodeURIComponent(rest.slice(2).join('/')) } : null;
    if (join) history.replaceState(null, '', location.pathname + '#/start');
    onboarding(root, { join }); return;
  }
  // ссылка-приглашение при уже подключённом устройстве = новый токен пары (после его замены)
  if (name === 'join' && rest.length >= 3 && rest[0] === app.cfg.owner && rest[1] === app.cfg.repo) {
    const tok = decodeURIComponent(rest.slice(2).join('/'));
    if (tok && tok !== app.cfg.token) { app.save({ token: tok }); app.repo.gh.token = tok; }
    history.replaceState(null, '', location.pathname + '#/home');
  }
  app.start(); mountShell();
}
app.on(() => { if (!shell) return; cur?.update?.(); drawBar(); });
app.onStatus(() => { if (!shell) return; drawBanner(); cur?.status?.(); });
addEventListener('hashchange', () => { if (shell && !location.hash.startsWith('#/join')) route(); });
addEventListener('tandem:lang', () => { setLang(app.cfg.lang); if (shell) route(); });
addEventListener('tandem:ready', () => mountShell());
// ошибки не должны молча ломать экран
addEventListener('unhandledrejection', (e) => { console.error(e.reason); });
if ('serviceWorker' in navigator && import.meta.env.PROD) navigator.serviceWorker.register('./sw.js').catch(() => {});
if (localStorage.getItem('tandem.debug')) window.__tandem = app; // для сквозных проверок
start();
void toast;
