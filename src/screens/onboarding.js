// Первый запуск: язык → профиль (имя, аватар, цвет) → создать пару или присоединиться → подключение к репозиторию данных.
import { h, icon, toast } from '../ui/dom.js';
import { app } from '../app.js';
import { t, LANGS, setLang } from '../i18n/index.js';
import { avatarJpeg } from '../core/image.js';
import { avatar } from '../ui/parts.js';
import { inviteLink } from './me.js';
import { GhError } from '../core/gh.js';

const COLORS = ['#946B3E', '#A75750', '#5E8A5C', '#4F7CA3', '#7A5C9E', '#C08A2E'];

export function onboarding(root, { join } = {}) {
  let joinTried = false;
  const st = { step: join ? 'profile' : 'lang', lang: app.cfg.lang, name: app.cfg.name || '', color: COLORS[0], avatar: null, avatarUrl: null, mode: join ? 'join' : null, repo: '', token: '', members: null, busy: false, err: '' };
  const go = (s) => { st.step = s; st.err = ''; if (s !== 'joining') joinTried = false; draw(); };
  const wrap = (...k) => h('div', { class: 'onb' }, ...k);
  const dots = () => h('div', { class: 'dots' }, ...(join ? ['lang', 'profile', 'joining'] : ['lang', 'profile', 'mode', 'connect']).map((s) => h('i', { class: s === st.step ? 'on' : '' })));
  const nextBtn = (label, fn, disabled) => h('button', { class: 'btn primary lg', disabled, onclick: fn }, label);

  function draw() {
    setLang(st.lang);
    root.replaceChildren(({ lang, profile, mode, connect, joining, done }[st.step])());
    window.scrollTo(0, 0);
  }
  const lang = () => wrap(dots(), h('div', { class: 'logo' }, icon('book', 44)), h('h1', {}, t('app.name')), h('p', { class: 'lead' }, t('onb.tagline')),
    h('div', { class: 'cap' }, t('onb.lang')),
    h('div', { class: 'col gap' }, ...LANGS.map((l) => h('button', { class: 'btn big' + (st.lang === l.id ? ' on' : ''), onclick: () => { st.lang = l.id; app.save({ lang: l.id, translation: null }); draw(); } }, l.name, st.lang === l.id ? icon('check', 20) : null))),
    h('div', { class: 'grow' }), nextBtn(t('common.next'), () => go('profile')));
  const profile = () => {
    const file = h('input', { type: 'file', accept: 'image/*', hidden: true, onchange: async (e) => { const f = e.target.files[0]; if (!f) return; try { st.avatar = await avatarJpeg(f); st.avatarUrl = URL.createObjectURL(st.avatar); draw(); } catch { toast(t('ci.photoErr')); } } });
    const name = h('input', { class: 'inp', value: st.name, maxlength: 30, placeholder: t('onb.namePh'), 'aria-label': t('me.name'), oninput: (e) => { st.name = e.target.value; btn.disabled = !st.name.trim(); } });
    const av = h('button', { class: 'avbtn big', 'aria-label': t('me.photo'), onclick: () => file.click() },
      st.avatarUrl ? h('span', { class: 'av img', style: { width: '112px', height: '112px', backgroundImage: `url(${st.avatarUrl})` } }) : h('span', { class: 'av', style: { width: '112px', height: '112px', fontSize: '46px', background: st.color } }, (st.name.trim()[0] || '?').toUpperCase()), h('span', { class: 'cam' }, icon('camera', 18)));
    const btn = nextBtn(t('common.next'), () => go(join ? 'joining' : st.mode ? 'connect' : 'mode'), !st.name.trim());
    return wrap(dots(), h('button', { class: 'lnk back', onclick: () => go('lang') }, icon('left', 18), t('common.back')), h('h2', {}, t('onb.profile')), h('div', { class: 'center' }, av, file),
      h('div', { class: 'cap' }, t('me.name')), name,
      h('div', { class: 'cap' }, t('onb.color')), h('div', { class: 'swatches' }, ...COLORS.map((c) => h('button', { class: 'sw-c' + (c === st.color ? ' on' : ''), style: { background: c }, 'aria-label': c, onclick: () => { st.color = c; draw(); } }))),
      h('div', { class: 'grow' }), btn);
  };
  const mode = () => wrap(dots(), h('button', { class: 'lnk back', onclick: () => go('profile') }, icon('left', 18), t('common.back')), h('h2', {}, t('onb.mode')),
    h('button', { class: 'card choice', onclick: () => { st.mode = 'create'; go('connect'); } }, icon('plus', 26), h('div', {}, h('b', {}, t('onb.create')), h('p', { class: 'muted' }, t('onb.createHint')))),
    h('div', { class: 'card choice static' }, icon('link', 26), h('div', {}, h('b', {}, t('onb.join')), h('p', { class: 'muted' }, t('onb.joinHint')))));
  const parse = (v) => { const m = /([\w.-]+)\/([\w.-]+?)(?:[/?#].*)?$/.exec(v.trim().replace(/^https?:\/\/[^#]*#\/join\//, '').replace(/^https?:\/\/github\.com\//, '')); return m ? { owner: m[1], repo: m[2] } : null; };
  const errText = (e) => t({ auth: 'onb.errAuth', notfound: 'onb.errNotFound', forbidden: 'onb.errForbidden', network: 'onb.errNet', full: 'onb.errFull', nocouple: 'onb.errNoCouple' }[e instanceof GhError ? e.kind : 'x'] || 'onb.errGeneric');
  const draftOf = () => ({ name: st.name.trim(), lang: st.lang, color: st.color, avatar: st.avatar });
  const connect = () => {
    const repoIn = h('input', { class: 'inp', value: st.repo, placeholder: 'owner/repo', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', 'aria-label': t('onb.repo'), oninput: (e) => { st.repo = e.target.value; link(); } });
    const tokIn = h('input', { class: 'inp', type: 'password', value: st.token, placeholder: 'github_pat_…', autocomplete: 'off', 'aria-label': t('onb.token'), oninput: (e) => { st.token = e.target.value; } });
    const tokLink = h('a', { class: 'btn sm', target: '_blank', rel: 'noopener' }, icon('link', 16), t('onb.makeToken'));
    const link = () => { const r = parse(st.repo); tokLink.href = 'https://github.com/settings/personal-access-tokens/new?' + new URLSearchParams({ name: 'Tandem', description: 'Bible reading together', expires_in: '365', ...(r ? { target_name: r.owner } : {}), contents: 'write' }); };
    link();
    const go2 = h('button', { class: 'btn primary lg', onclick: submit }, st.busy ? t('onb.connecting') : t('onb.createGo'));
    async function submit() {
      const r = parse(st.repo); if (!r) { st.err = t('onb.errRepo'); return draw(); }
      if (!st.token.trim()) { st.err = t('onb.errToken'); return draw(); }
      st.busy = true; go2.disabled = true; go2.textContent = t('onb.connecting');
      try { await app.connect({ token: st.token.trim(), owner: r.owner, repo: r.repo, create: true, draft: draftOf() }); st.busy = false; go('done'); }
      catch (e) { st.busy = false; st.err = errText(e); draw(); }
    }
    return wrap(dots(), h('button', { class: 'lnk back', onclick: () => go('mode') }, icon('left', 18), t('common.back')), h('h2', {}, t('onb.create')),
      h('ol', { class: 'steps' }, h('li', {}, t('onb.c1')), h('li', {}, t('onb.c2')), h('li', {}, t('onb.c3'))),
      h('div', { class: 'cap' }, t('onb.repo')), repoIn,
      h('div', { class: 'cap' }, t('onb.token')), tokIn, h('div', { class: 'row gap wrap' }, tokLink, h('span', { class: 'muted small' }, t('onb.tokenHint'))),
      st.err ? h('p', { class: 'err', role: 'alert' }, st.err) : null,
      h('div', { class: 'grow' }), go2);
  };
  // присоединение по ссылке: токен и репозиторий уже в ссылке, ввод не нужен
  const joining = () => {
    async function run(asMember) {
      st.busy = true; st.err = ''; st.members = null; draw();
      try { await app.connect({ token: join.token, owner: join.owner, repo: join.repo, create: false, asMember, draft: draftOf() }); st.busy = false; finish(); }
      catch (e) { st.busy = false; if (e && e.kind === 'full') st.members = e.members; else st.err = errText(e); draw(); }
    }
    if (!joinTried) { joinTried = true; setTimeout(() => run(), 0); }
    return wrap(dots(), h('button', { class: 'lnk back', onclick: () => go('profile') }, icon('left', 18), t('common.back')), h('h2', {}, t('onb.join')),
      st.busy ? h('p', { class: 'lead' }, t('onb.connecting')) : null,
      st.members ? [h('p', { class: 'lead' }, t('onb.whoAreYou')), ...st.members.map((m) => h('button', { class: 'btn big', onclick: () => run(m.id) }, m.name, icon('right', 18)))] : null,
      st.err ? [h('p', { class: 'err', role: 'alert' }, st.err), h('button', { class: 'btn primary lg', onclick: () => run() }, t('common.retry'))] : null);
  };
  const done = () => wrap(h('div', { class: 'logo ok' }, icon('check', 44)), h('h2', {}, t('onb.done')), h('p', { class: 'lead' }, t('onb.doneText')),
    h('div', { class: 'card inv' }, h('p', {}, t('onb.inviteSteps')), h('code', { class: 'key' }, inviteLink()),
      h('div', { class: 'row gap' }, h('button', { class: 'btn', onclick: async () => { try { await navigator.clipboard.writeText(inviteLink()); toast(t('common.copied')); } catch { toast(inviteLink()); } } }, icon('copy', 18), t('common.copy')),
        navigator.share ? h('button', { class: 'btn', onclick: () => navigator.share({ title: t('app.name'), text: t('me.shareText'), url: inviteLink() }).catch(() => {}) }, icon('share', 18), t('me.share')) : null)),
    h('div', { class: 'grow' }), nextBtn(t('onb.start'), finish));
  function finish() { app.start(); location.hash = '#/home'; dispatchEvent(new Event('tandem:ready')); }
  draw();
}
void avatar;
