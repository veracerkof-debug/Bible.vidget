// Запуск в GitHub Actions репозитория данных (см. data-template/notify.yml и docs/setup.md):
//   push → уведомить партнёра о новых отчётах, подтверждениях и событиях;  schedule → напоминания и памятные дни.
// Нужны: переменная VAPID_PRIVATE (секрет), в couple.json — vapid.pub. Пакет web-push ставит workflow.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { planFromAdded, planScheduled } from './notify-lib.mjs';

const dry = process.argv.includes('--dry');
const readJSON = (p) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; } };
const couple = readJSON('couple.json');
if (!couple?.vapid?.pub) { console.log('couple.json без vapid.pub — уведомления не настроены'); process.exit(0); }
const members = {}, subs = {};
if (existsSync('u')) for (const l of readdirSync('u')) {
  const p = readJSON(`u/${l}/profile.json`); if (p) members[l] = p;
  subs[l] = readJSON(`u/${l}/push.json`)?.subs || [];
}
let plan = [];
if (process.env.GITHUB_EVENT_NAME === 'schedule' || process.env.NOTIFY_MODE === 'schedule') {
  const annivs = [];
  const del = new Set();
  const ev = [];
  for (const l of Object.keys(members)) if (existsSync(`u/${l}/e`)) for (const f of readdirSync(`u/${l}/e`)) { const e = readJSON(`u/${l}/e/${f}`); if (e) ev.push({ ...e, id: f.slice(0, -5) }); }
  ev.forEach((e) => { if (e.type === 'anniv-del') del.add(e.of); });
  ev.forEach((e) => { if (e.type === 'anniv' && !del.has(e.id)) annivs.push(e); });
  const today = (login, date) => existsSync(`u/${login}/c/${date}.json`);
  plan = planScheduled({ now: new Date(), members, hasCheckin: today, annivs });
} else {
  const before = process.env.NOTIFY_BEFORE || '', after = process.env.NOTIFY_AFTER || 'HEAD';
  let names = '';
  try {
    names = /^0+$/.test(before) || !before ? execSync(`git show --name-status --format= ${after}`, { encoding: 'utf8' })
      : execSync(`git diff --name-status ${before} ${after}`, { encoding: 'utf8' });
  } catch (e) { console.log('не удалось получить список изменений: ' + e.message); }
  const added = names.split('\n').filter((l) => l.startsWith('A\t')).map((l) => l.slice(2));
  plan = planFromAdded(added, readJSON, members);
}
console.log(`к отправке: ${plan.length}`);
if (dry) { console.log(JSON.stringify(plan, null, 2)); process.exit(0); }
const { default: webpush } = await import('web-push');
webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:noreply@example.com', couple.vapid.pub, process.env.VAPID_PRIVATE);
for (const n of plan) {
  for (const s of subs[n.to] || []) {
    try { await webpush.sendNotification(s, JSON.stringify({ title: n.title, body: n.body, tag: n.tag, url: n.url }), { TTL: 86400 }); console.log('→', n.to, n.title); }
    catch (e) { console.log('сбой', n.to, e.statusCode || e.message); }
  }
}
