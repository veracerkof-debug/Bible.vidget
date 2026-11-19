// Сквозная проверка: два «телефона» (две сессии Chromium), общий фальшивый GitHub.
// Запуск: npm run build && node tests/e2e/run.mjs   (PW_CHROMIUM — путь к Chromium, SHOTS — куда класть снимки)
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { FakeGitHub } from '../helpers/fakegh.js';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';

const PORT = 4179, URL = `http://localhost:${PORT}/`;
const SHOTS = process.env.SHOTS || '/tmp/shots'; mkdirSync(SHOTS, { recursive: true });
process.on('SIGTERM', () => process.exit(1));
const srv = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
const fake = new FakeGitHub();
fake.addUser('ta', 'alice'); fake.addUser('tb', 'bob'); fake.addRepo('alice/data', { collaborators: ['bob'] });
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC', 'base64');
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'access-control-expose-headers': 'etag' };

async function phone(browser, name, locale) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, locale, timezoneId: 'Asia/Samarkand', serviceWorkers: 'block', hasTouch: true, isMobile: true });
  await ctx.route('https://api.github.com/**', async (route) => {
    const r = route.request();
    if (r.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    const h = r.headers();
    const res = await fake.fetch(r.url(), { method: r.method(), headers: { Authorization: h.authorization, 'If-None-Match': h['if-none-match'] }, body: r.postData() });
    const buf = Buffer.from(await res.arrayBuffer());
    route.fulfill({ status: res.status, headers: { ...CORS, ...Object.fromEntries(res.headers) }, body: buf });
  });
  const page = await ctx.newPage();
  page.setDefaultTimeout(15000);
  page.on('pageerror', (e) => { console.error(name, 'PAGEERROR', e.message); process.exitCode = 1; });
  page.on('console', (m) => { if (m.type() === 'error') console.error(name, 'console.error', m.text()); });
  return { ctx, page };
}
const shot = (p, n) => p.screenshot({ path: `${SHOTS}/${n}.png` });
const ok = (m) => console.log('✓', m);
// ждать, пока условие станет истинным (запись в репозиторий идёт в фоне)
const until = async (fn, what, ms = 8000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (fn()) return; await new Promise((r) => setTimeout(r, 150)); } throw new Error('не дождались: ' + what + '; файлы: ' + [...fake.files('alice/data').keys()].join(', ')); };

try {
  await new Promise((r) => setTimeout(r, 2500));
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium' });
  const A = await phone(browser, 'alice', 'ru-RU'), B = await phone(browser, 'bob', 'en-US');

  // — Алиса создаёт пару —
  const a = A.page; await a.addInitScript(() => localStorage.setItem('tandem.debug', '1')); await a.goto(URL);
  await shot(a, '01-onb-lang');
  await a.getByRole('button', { name: 'Далее' }).click();
  await a.getByPlaceholder('Как называть').fill('Александр');
  await shot(a, '02-onb-profile');
  await a.getByRole('button', { name: 'Далее' }).click();
  await a.locator('.card.choice').first().click();
  await a.getByLabel('Репозиторий данных (владелец/название)').fill('alice/data');
  await a.getByLabel('Токен доступа').fill('ta');
  await shot(a, '03-onb-connect');
  await a.getByRole('button', { name: 'Создать пару' }).last().click();
  await a.getByText('Пара создана').waitFor();
  await shot(a, '04-onb-done');
  assert.ok(fake.readJSON('alice/data', 'couple.json').id); assert.equal(fake.readJSON('alice/data', 'u/alice/profile.json').name, 'Александр'); ok('пара создана, профиль в репозитории');
  await a.getByRole('button', { name: 'Начать' }).click();
  await a.locator('.home').waitFor(); await shot(a, '05-home-alone');

  // — Боб присоединяется по ссылке —
  const b = B.page; await b.goto(URL + '#/join/alice/data');
  await b.getByRole('button', { name: 'Next' }).waitFor().catch(() => {});
  await b.getByPlaceholder('What to call you').fill('Bob');
  await b.getByRole('button', { name: 'Next' }).click();
  assert.equal(await b.getByLabel('Data repository (owner/name)').inputValue(), 'alice/data');
  await b.getByLabel('Access token').fill('tb');
  await b.getByRole('button', { name: 'Join' }).last().click();
  await b.locator('.home').waitFor();
  assert.equal(fake.readJSON('alice/data', 'u/bob/profile.json').name, 'Bob'); ok('Боб присоединился по ссылке');

  // — Алиса: отчёт с фото —
  await a.reload(); await a.locator('.home').waitFor();
  await a.waitForFunction(() => document.querySelector('.cci.theirs .cname')?.textContent === 'Bob');
  await a.locator('.cci.mine').click();
  await a.locator('input[capture]').setInputFiles({ name: 'x.png', mimeType: 'image/png', buffer: png });
  await a.getByRole('button', { name: 'Выбрать отрывок' }).click();
  await a.getByRole('button', { name: 'Ин', exact: true }).click();
  await a.getByRole('button', { name: '3', exact: true }).dblclick();
  await a.locator('textarea').fill('Так возлюбил Бог мир — это и есть основа всего.');
  await shot(a, '06-checkin-form');
  await shot(a, '06b-before-post');
  await a.getByRole('button', { name: 'Отправить отчёт' }).click();
  await new Promise((r) => setTimeout(r, 1500));
  console.log('очередь/статус:', JSON.stringify(await a.evaluate(() => ({ q: window.__tandem.repo.queue.map((x) => x.path), st: window.__tandem.repo.status, ci: window.__tandem.model.checkins }))));
  await a.waitForFunction(() => document.querySelector('.cci.mine.has'));
  const today = await a.evaluate(() => { const d = new Date(); const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; });
  await until(() => fake.files('alice/data').has(`u/alice/c/${today}.json`), 'отчёт Алисы');
  const ci = fake.readJSON('alice/data', `u/alice/c/${today}.json`);
  assert.equal(ci.ref.b, 'JOH'); assert.ok(fake.files('alice/data').has(`u/alice/p/${today}.jpg`)); ok('отчёт и фото записаны в репозиторий');
  await shot(a, '07-home-posted');

  // — Боб видит отчёт, подтверждает, пишет свой —
  await b.reload(); await b.locator('.cci.theirs.has').waitFor();
  assert.ok(await b.locator('.tab .badge').count(), 'бейдж ожидающих подтверждения');
  await shot(b, '08-bob-home');
  await b.locator('.cci.theirs').click();
  await b.getByRole('button', { name: 'Confirm' }).click();
  await until(() => fake.files('alice/data').has(`u/bob/a/c-${today}.json`), 'подтверждение Боба');
  assert.ok(fake.files('alice/data').has(`u/bob/a/c-${today}.json`)); ok('подтверждение записано в папку Боба');
  await b.reload(); await b.locator('.cci.mine').click();
  await b.getByRole('button', { name: 'Choose passage' }).click();
  await b.getByRole('button', { name: 'Psa', exact: true }).click();
  await b.getByRole('button', { name: '23', exact: true }).dblclick();
  await b.locator('textarea').fill('The Lord is my shepherd.');
  await b.getByRole('button', { name: 'Post check-in' }).click();
  await until(() => fake.files('alice/data').has(`u/bob/c/${today}.json`), 'отчёт Боба');

  // — Алиса подтверждает отчёт Боба: серия «вместе» = 1 —
  await a.reload(); await a.locator('.cci.theirs.has').waitFor();
  await a.locator('.cci.theirs').click(); await a.getByRole('button', { name: 'Подтвердить' }).click();
  await until(() => fake.files('alice/data').has(`u/alice/a/c-${today}.json`), 'подтверждение Алисы');
  await a.reload(); await a.locator('.streaks').waitFor();
  const st = await a.locator('.streaks').innerText(); console.log('серии:', st.replace(/\s+/g, ' '));
  assert.match(st.replace(/\s+/g, ' '), /Вместе\s*1/); ok('совместная серия = 1');
  await shot(a, '09-home-streak');

  // — остальные экраны —
  await a.goto(URL + '#/word/JOH.3'); await a.locator('.wp .v').first().waitFor();
  await a.locator('.wp .v').nth(15).click(); await shot(a, '10-word-select');
  await a.getByRole('button', { name: 'Выделить' }).first().click(); await shot(a, '11-word-hl');
  await a.goto(URL + '#/chat'); await a.locator('.feed').waitFor(); await new Promise((r) => setTimeout(r, 600)); await shot(a, '12-chat');
  await a.getByPlaceholder(/Сообщение/).fill('Доброе утро!'); await a.keyboard.press('Enter'); await new Promise((r) => setTimeout(r, 600));
  await a.goto(URL + '#/history'); await a.locator('.cal').waitFor(); await shot(a, '13-history');
  await a.goto(URL + '#/me'); await a.locator('.card.pro').waitFor(); await shot(a, '14-me');
  await b.goto(URL + '#/chat'); await b.reload(); await b.locator('.feed').waitFor(); await new Promise((r) => setTimeout(r, 800)); await shot(b, '15-bob-chat');
  assert.ok((await b.locator('.bub').allInnerTexts()).includes('Доброе утро!')); ok('сообщение дошло до Боба');
  await a.goto(URL + '#/me'); await a.locator('.card.pro').waitFor();
  await a.evaluate(() => { document.documentElement.dataset.theme = 'dark'; }); await shot(a, '16-dark');
  await b.close; await browser.close();
  console.log('ВСЁ ПРОШЛО');
} catch (e) { console.error('СБОЙ:', e); process.exitCode = 1; }
finally { srv.kill(); }
