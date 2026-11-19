// Web Push на устройстве: разрешение, подписка, запись подписки в u/<я>/push.json (читает workflow репозитория данных).
import { app } from '../app.js';
import { P } from './model.js';
import { urlB64ToBytes } from './vapid.js';

export const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
export async function pushState() {
  if (!pushSupported()) return { supported: false, permission: 'unsupported', subscribed: false };
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = reg ? await reg.pushManager.getSubscription() : null;
  return { supported: true, permission: Notification.permission, subscribed: !!sub };
}
export async function enablePush() {
  const pub = app.model.couple?.vapid?.pub;
  if (!pub) throw new Error('novapid');
  if (await Notification.requestPermission() !== 'granted') throw new Error('denied');
  const reg = await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToBytes(pub) });
  const cur = app.repo.get(P.push(app.me))?.subs || [];
  const j = sub.toJSON();
  const subs = [...cur.filter((s) => s.endpoint !== j.endpoint), { endpoint: j.endpoint, keys: j.keys, at: new Date().toISOString() }];
  app.repo.writeJSON(P.push(app.me), { subs }, 'Уведомления');
}
export async function disablePush() {
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = reg && await reg.pushManager.getSubscription();
  if (sub) { const ep = sub.endpoint; await sub.unsubscribe(); const cur = app.repo.get(P.push(app.me))?.subs || []; app.repo.writeJSON(P.push(app.me), { subs: cur.filter((s) => s.endpoint !== ep) }, 'Уведомления'); }
}
