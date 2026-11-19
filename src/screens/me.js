// Профиль и настройки: аватар и имя, партнёр и приглашение, памятные дни, уведомления, язык, перевод, тема, синхронизация.
import { h, icon, sheet, toast, confirmSheet } from '../ui/dom.js';
import { app } from '../app.js';
import { t, LANGS } from '../i18n/index.js';
import { avatar, segmented, lazyImg } from '../ui/parts.js';
import { avatarJpeg } from '../core/image.js';
import { translationsFor, TRANSLATIONS } from '../core/canon.js';
import { openAnniv } from './anniv.js';
import { openNotifs } from './notifs.js';
import { isIOS, isStandalone } from '../core/push.js';

export const inviteLink = () => `${location.origin}${location.pathname}#/join/${app.cfg.owner}/${app.cfg.repo}`;

export function me() {
  const el = h('div', { class: 'screen me' });
  const file = h('input', { type: 'file', accept: 'image/*', hidden: true, onchange: async (e) => { const f = e.target.files[0]; if (!f) return; try { app.setAvatar(await avatarJpeg(f)); } catch { toast(t('ci.photoErr')); } } });
  function render() {
    const m = app.model, pp = app.partnerProfile, mine = app.profile(app.me);
    const nameIn = h('input', { class: 'inp name', value: mine.name || '', maxlength: 30, 'aria-label': t('me.name'), onchange: (e) => { const v = e.target.value.trim(); if (v) app.saveProfile({ name: v }); } });
    const av = h('button', { class: 'avbtn', 'aria-label': t('me.photo'), onclick: () => file.click() }, avatar(app.me, 76), h('span', { class: 'cam' }, icon('camera', 16)));
    const st = app.repo?.status || {};
    const q = app.repo?.queue.length || 0;
    const stText = st.authError ? t('me.authErr') : st.offline ? t('me.offline', { n: q }) : q ? t('me.sending', { n: q }) : t('me.synced');
    const trs = [...translationsFor(app.lang), ...TRANSLATIONS.filter((x) => x.lang !== app.lang)];
    el.replaceChildren(
      h('div', { class: 'card pro' }, av, h('div', { class: 'grow' }, nameIn, h('div', { class: 'muted' }, pp ? `${mine.name} & ${pp.name}` : '@' + app.me))),
      h('div', { class: 'cap' }, t('me.partner')),
      pp ? h('div', { class: 'card li' }, avatar(app.partner, 44), h('b', { class: 'grow' }, pp.name)) : invite(),
      h('div', { class: 'cap' }, t('me.together')),
      h('div', { class: 'card list' },
        navRow('heart', t('an.title'), `${m.anniversaries.length || ''}`, () => openAnniv()),
        navRow('bell', t('nf.title'), '', () => openNotifs())),
      h('div', { class: 'cap' }, t('me.settings')),
      h('div', { class: 'card list pad' },
        field(t('me.lang'), segmented(LANGS.map((l) => [l.id, l.name]), app.lang, (v) => { app.saveProfile({ lang: v }); app.save({ translation: null }); dispatchEvent(new Event('tandem:lang')); }, 'wrap')),
        field(t('me.translation'), h('select', { class: 'inp', onchange: (e) => app.save({ translation: e.target.value }) }, ...trs.map((x) => h('option', { value: x.id, selected: x.id === app.translation }, x.full.startsWith(x.name) ? x.full : `${x.name} — ${x.full}`)))),
        field(t('me.theme'), segmented([['auto', t('th.auto')], ['light', t('th.light')], ['paper', t('th.paper')], ['dark', t('th.dark')], ['oled', 'OLED']], app.cfg.theme || 'auto', (v) => { app.save({ theme: v }); render(); }, 'wrap')),
        field(t('me.weekStart'), segmented([[1, t('wk.mon')], [0, t('wk.sun')]], app.weekFirst, (v) => { app.save({ weekFirst: v }); app.rebuild(); app.emit(); render(); })),
        field(t('me.weekGoal'), h('div', { class: 'stepper' }, h('button', { class: 'ibtn round', 'aria-label': '−', onclick: () => goal(-1) }, '−'), h('b', {}, String(app.cfg.weekGoal ?? 5)), h('button', { class: 'ibtn round', 'aria-label': '+', onclick: () => goal(1) }, '+')))),
      isIOS() && !isStandalone() ? h('p', { class: 'note' }, t('me.iosInstall')) : null,
      h('div', { class: 'cap' }, t('me.data')),
      h('div', { class: 'card list pad' },
        h('div', { class: 'li' }, icon(st.authError ? 'lock' : 'refresh', 20), h('div', { class: 'grow' }, h('b', {}, `${app.cfg.owner}/${app.cfg.repo}`), h('div', { class: 'muted small' }, stText)), h('button', { class: 'btn sm', onclick: async () => { await app.sync(); render(); toast(t('me.synced')); } }, t('me.sync'))),
        st.authError ? h('p', { class: 'note' }, t('me.tokenHelp'), ' ', h('button', { class: 'lnk', onclick: newToken }, t('me.newToken'))) : null,
        h('button', { class: 'btn ghost danger', onclick: leave }, t('me.disconnect'))),
      h('p', { class: 'muted small center pad' }, t('me.about')), file);
  }
  const goal = (d) => { app.save({ weekGoal: Math.min(7, Math.max(1, (app.cfg.weekGoal ?? 5) + d)) }); app.rebuild(); app.emit(); render(); };
  const field = (l, c) => h('div', { class: 'fld' }, h('label', {}, l), c);
  const navRow = (ic, label, val, fn) => h('button', { class: 'li btn-li', onclick: fn }, icon(ic, 22), h('div', { class: 'grow' }, label), val ? h('span', { class: 'muted' }, val) : null, icon('right', 18, 'dim'));
  function invite() {
    const link = inviteLink();
    return h('div', { class: 'card inv' }, h('p', {}, t('me.inviteText')),
      h('ol', { class: 'steps' }, h('li', {}, t('me.inv1', { repo: `${app.cfg.owner}/${app.cfg.repo}` }), ' ', h('a', { href: `https://github.com/${app.cfg.owner}/${app.cfg.repo}/settings/access`, target: '_blank', rel: 'noopener' }, t('me.open'))), h('li', {}, t('me.inv2'))),
      h('code', { class: 'key' }, link),
      h('div', { class: 'row gap' }, h('button', { class: 'btn', onclick: async () => { try { await navigator.clipboard.writeText(link); toast(t('common.copied')); } catch { toast(link); } } }, icon('copy', 18), t('common.copy')),
        navigator.share ? h('button', { class: 'btn', onclick: () => navigator.share({ title: t('app.name'), text: t('me.shareText'), url: link }).catch(() => {}) }, icon('share', 18), t('me.share')) : null));
  }
  async function leave() { if (await confirmSheet({ title: t('me.disconnect'), text: t('me.disconnectText'), ok: t('me.disconnect'), cancel: t('common.cancel'), danger: true })) { app.disconnect(); location.hash = '#/start'; location.reload(); } }
  function newToken() {
    const inp = h('input', { class: 'inp', placeholder: 'github_pat_…', type: 'password', autocomplete: 'off' });
    const s = sheet({ title: t('me.newToken'), body: h('div', { class: 'sh-body' }, h('h3', { class: 'sh-title' }, t('me.newToken')), inp, h('button', { class: 'btn primary lg', onclick: () => { if (!inp.value.trim()) return; app.save({ token: inp.value.trim() }); app.repo.gh.token = inp.value.trim(); s.close(true); app.sync().then(render); } }, t('common.save'))) });
  }
  render();
  return { el, update: render, status: render };
}
void lazyImg;
