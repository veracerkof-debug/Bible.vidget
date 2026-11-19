// Уведомления: включение на этом устройстве, напоминание, и (для создателя пары) настройка отправки через GitHub Actions.
import { h, icon, sheet, toast } from '../ui/dom.js';
import { app } from '../app.js';
import { t } from '../i18n/index.js';
import { toggle } from '../ui/parts.js';
import { generateVapid } from '../core/vapid.js';
import { pushState, enablePush, disablePush, isIOS, isStandalone } from '../core/push.js';
import { P } from '../core/model.js';
import yml from '../../data-template/notify.yml?raw';

const copy = async (s) => { try { await navigator.clipboard.writeText(s); toast(t('common.copied')); } catch { toast(s); } };

export function openNotifs() {
  const body = h('div', { class: 'sh-body tall' });
  const isCreator = app.model.couple?.creator === app.me;
  async function draw() {
    const st = await pushState();
    const hasKey = !!app.model.couple?.vapid?.pub;
    const prof = app.repo.get(P.profile(app.me)) || {};
    const rem = prof.remind || { on: false, hour: 20 };
    const hour = h('select', { class: 'inp sm', 'aria-label': t('nf.hour'), onchange: (e) => app.saveProfile({ remind: { ...rem, hour: +e.target.value } }) }, ...Array.from({ length: 24 }, (_, i) => h('option', { value: i, selected: i === (rem.hour ?? 20) }, String(i).padStart(2, '0') + ':00')));
    const out = [h('h3', { class: 'sh-title' }, t('nf.title'))];
    if (isIOS() && !isStandalone()) out.push(h('p', { class: 'note' }, t('nf.ios')));
    if (!st.supported) out.push(h('p', { class: 'muted' }, t('nf.unsupported')));
    else if (!hasKey) out.push(h('p', { class: 'muted' }, t(isCreator ? 'nf.needSetup' : 'nf.waitCreator')));
    else out.push(h('div', { class: 'li' }, icon('bell', 22), h('div', { class: 'grow' }, h('b', {}, t('nf.device')), h('div', { class: 'muted small' }, st.subscribed ? t('nf.on') : st.permission === 'denied' ? t('nf.denied') : t('nf.off'))),
      toggle(st.subscribed, async (on) => { try { on ? await enablePush() : await disablePush(); } catch (e) { toast(t(e.message === 'denied' ? 'nf.denied' : 'nf.err')); } draw(); }, t('nf.device'))));
    out.push(h('div', { class: 'li' }, icon('history', 22), h('div', { class: 'grow' }, h('b', {}, t('nf.remind')), h('div', { class: 'muted small' }, t('nf.remindHint'))), toggle(rem.on, (on) => app.saveProfile({ remind: { ...rem, on } }), t('nf.remind'))));
    out.push(h('div', { class: 'li' }, icon('calendar', 22), h('div', { class: 'grow' }, t('nf.hour')), hour));
    if (isCreator) out.push(setup(hasKey));
    body.replaceChildren(...out);
  }
  function setup(hasKey) {
    const { owner, repo, branch } = app.cfg;
    const box = h('div', { class: 'setup' }, h('h4', {}, t('nf.setup')), h('p', { class: 'muted small' }, t('nf.setupHint')));
    const keyOut = h('div', {});
    const gen = h('button', { class: 'btn', onclick: async () => {
      const k = await generateVapid();
      const c = { ...(app.model.couple || {}), vapid: { pub: k.pub } };
      app.repo.writeJSON(P.couple, c, 'Ключ уведомлений');
      keyOut.replaceChildren(h('p', { class: 'note' }, t('nf.keyOnce')), h('code', { class: 'key' }, k.priv), h('button', { class: 'btn sm', onclick: () => copy(k.priv) }, icon('copy', 16), t('common.copy')));
      draw2();
    } }, icon('refresh', 18), t(hasKey ? 'nf.regen' : 'nf.gen'));
    const base = `https://github.com/${owner}/${repo}`;
    const draw2 = () => {};
    box.append(step(1, t('nf.s1'), gen), keyOut,
      step(2, t('nf.s2'), h('a', { class: 'btn', href: `${base}/settings/secrets/actions/new`, target: '_blank', rel: 'noopener' }, icon('link', 18), t('nf.open'))),
      step(3, t('nf.s3'), h('a', { class: 'btn', href: `${base}/new/${branch || 'main'}?filename=${encodeURIComponent('.github/workflows/notify.yml')}&value=${encodeURIComponent(yml)}`, target: '_blank', rel: 'noopener' }, icon('link', 18), t('nf.open'))),
      step(4, t('nf.s4'), null), h('p', { class: 'muted small' }, t('nf.free')));
    return box;
  }
  const step = (n, text, action) => h('div', { class: 'stp' }, h('i', {}, n), h('div', { class: 'grow' }, h('p', {}, text), action));
  const s = sheet({ title: t('nf.title'), body, full: true });
  draw();
  return s;
}
