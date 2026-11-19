// Состояние приложения и все действия пользователя. Экраны только показывают и вызывают эти действия.
import { GitHub, GhError } from './core/gh.js';
import { Repo } from './core/repo.js';
import { idbKV } from './core/kv.js';
import { buildModel, P, ckey, ekey, newId } from './core/model.js';
import { dstr } from './core/dates.js';
import { setLang, guessLang } from './i18n/index.js';
import { TRANSLATIONS, defaultTranslation } from './core/canon.js';

const CFG = 'tandem.cfg';
const load = () => { try { return JSON.parse(localStorage.getItem(CFG)); } catch { return null; } };
const tz = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return 'UTC'; } };

export const app = {
  cfg: load() || { theme: 'auto', lang: guessLang() },
  repo: null, model: null, today: dstr(), subs: new Set(), statusSubs: new Set(), timers: [], _sig: '',
  get connected() { return !!(this.cfg.token && this.cfg.owner && this.cfg.repo && this.cfg.login); },
  get lang() { return this.cfg.lang; },
  get me() { return this.cfg.login; },
  get partner() { return this.model?.partner || null; },
  get weekFirst() { return this.cfg.weekFirst ?? (this.cfg.lang === 'en' ? 0 : 1); },
  get translation() { return this.cfg.translation || defaultTranslation(this.cfg.lang); },
  save(patch) {
    Object.assign(this.cfg, patch);
    try { localStorage.setItem(CFG, JSON.stringify(this.cfg)); } catch { /* приватный режим: настройки живут до закрытия */ }
    setLang(this.cfg.lang); this.applyTheme();
  },
  applyTheme() { const t = this.cfg.theme; if (t && t !== 'auto') document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme; },
  on(fn) { this.subs.add(fn); return () => this.subs.delete(fn); },
  emit() { this.subs.forEach((f) => { try { f(); } catch (e) { console.error(e); } }); },
  onStatus(fn) { this.statusSubs.add(fn); return () => this.statusSubs.delete(fn); },
  statusSig() { const s = this.repo?.status || {}; return [s.offline, s.authError, this.repo?.queue.length, s.error].join('|'); },
  rebuild() {
    this.today = dstr();
    this.model = buildModel(this.repo ? this.repo.docs : new Map(), this.me, this.today, { weekFirst: this.weekFirst, weekGoal: this.cfg.weekGoal ?? 5 });
  },
  profile(login) {
    const p = this.model?.members[login];
    return p || { login, name: login === this.me ? (this.cfg.name || login) : (login || '—'), color: '#946B3E' };
  },
  get partnerProfile() { return this.partner ? this.profile(this.partner) : null; },

  attach() {
    const { token, owner, repo, branch } = this.cfg;
    const gh = new GitHub({ token, owner, repo, branch });
    this.repo = new Repo({ gh, kv: idbKV('tandem-' + owner + '-' + repo), onChange: () => { this.rebuild(); this.emit(); } });
  },
  async boot() {
    setLang(this.cfg.lang); this.applyTheme();
    if (!this.connected) { this.rebuild(); return false; }
    this.attach();
    await this.repo.load(); this.rebuild();
    return true;
  },
  start() { // фоновая синхронизация: при открытии, возврате в приложение, появлении сети и раз в полминуты
    const tick = () => { if (document.visibilityState === 'visible') this.sync(); };
    this.timers.push(setInterval(tick, 30000), setInterval(() => { if (dstr() !== this.today) { this.rebuild(); this.emit(); } }, 60000));
    document.addEventListener('visibilitychange', tick); addEventListener('online', tick);
    this.sync();
  },
  async sync() {
    if (!this.repo) return;
    try { await this.repo.flush(); await this.repo.sync(); } catch { /* состояние в repo.status */ }
    const sig = this.statusSig();
    if (sig !== this._sig) { this._sig = sig; this.statusSubs.forEach((f) => f()); }
  },

  // ——— подключение к репозиторию данных ———
  // Один токен на пару (его создаёт создатель и отдаёт в ссылке-приглашении). Участник — не аккаунт GitHub, а идентификатор,
  // созданный в приложении. Новое устройство того же человека входит как «уже существующий участник» (asMember).
  async connect({ token, owner, repo, create, draft, asMember }) {
    const gh = new GitHub({ token, owner, repo });
    const info = await gh.repoInfo(); // 401 — токен не принят; 404 — нет репозитория или доступа
    if (!info.permissions?.push) throw new GhError('forbidden', 403, 'no push');
    const prev = { ...this.cfg };
    const login = asMember || 'm' + newId();
    this.save({ token, owner, repo, branch: info.default_branch, login }); this.attach();
    try {
      await this.repo.load(); await this.repo.sync();
      const found = this.repoMembers();
      if (!asMember && Object.keys(found).length >= 2) { const e = new GhError('full', 0, 'pair is full'); e.members = Object.entries(found).map(([id, p]) => ({ id, name: p.name })); throw e; }
      if (!this.repo.has(P.couple)) {
        if (!create) throw new GhError('nocouple', 0, 'no couple.json');
        await this.repo.writeJSON(P.couple, { v: 1, id: newId(), created: new Date().toISOString(), creator: login }, 'Создание пары');
      }
      const old = this.repo.get(P.profile(login)) || {};
      const prof = { name: old.name || draft?.name || 'Tandem', lang: draft?.lang || old.lang || this.cfg.lang, color: old.color || draft?.color || '#946B3E', tz: tz(), joined: old.joined || new Date().toISOString(), remind: old.remind || { on: false, hour: 20 }, avatar: old.avatar || null };
      if (draft?.avatar && !old.avatar) { prof.avatar = P.avatar(login); await this.repo.writeFile(prof.avatar, draft.avatar, 'Аватар'); }
      await this.repo.writeJSON(P.profile(login), prof, 'Профиль');
      this.save({ name: prof.name, lang: prof.lang });
      this.rebuild(); this.emit();
    } catch (e) { this.repo = null; this.cfg = prev; try { localStorage.setItem(CFG, JSON.stringify(prev)); } catch { /* ok */ } throw e; }
  },
  repoMembers() { const o = {}; for (const [p, d] of this.repo.docs) { const m = /^u\/([^/]+)\/profile\.json$/.exec(p); if (m) o[m[1]] = d; } return o; },
  disconnect() {
    this.timers.forEach(clearInterval); this.timers = [];
    this.save({ token: null, owner: null, repo: null, login: null }); this.repo = null; this.rebuild();
    try { indexedDB.databases?.().then((l) => l.forEach((d) => d.name?.startsWith('tandem-') && indexedDB.deleteDatabase(d.name))); } catch { /* не критично */ }
  },

  // ——— действия ———
  _write(path, data, msg) { this.repo.writeJSON(path, data, msg); },
  saveProfile(patch) {
    const cur = this.repo.get(P.profile(this.me)) || {};
    const next = { ...cur, ...patch, tz: tz() };
    this._write(P.profile(this.me), next, 'Профиль');
    if (patch.lang) this.save({ lang: patch.lang });
    if (patch.name) this.save({ name: patch.name });
  },
  setAvatar(blob) { this.repo.writeFile(P.avatar(this.me), blob, 'Аватар'); this.saveProfile({ avatar: P.avatar(this.me), avatarV: Date.now() }); },
  postCheckin({ ref, text, photo, date }) {
    date ||= this.today;
    const old = this.repo.get(P.checkin(this.me, date));
    const doc = { date, ref, tr: this.translation, text: (text || '').trim(), photo: old?.photo || null, at: old?.at || new Date().toISOString(), edited: old ? new Date().toISOString() : undefined };
    if (photo) { doc.photo = P.photo(this.me, date); this.repo.writeFile(doc.photo, photo, 'Фото ' + date); } // фото уходит раньше отчёта
    this._write(P.checkin(this.me, date), doc, 'Отчёт ' + date);
  },
  ack(author, key) { if (author === this.me || this.model.isAcked(author, key)) return; this._write(P.ack(this.me, key), { of: author, key, at: new Date().toISOString() }, 'Подтверждение'); },
  sendEvent(type, data = {}) { const id = newId(); this._write(P.event(this.me, id), { type, at: new Date().toISOString(), ...data }, type); return id; },
  setHighlight(key, color) {
    const cur = { ...(this.model.highlights[this.me] || {}) };
    if (color) cur[key] = color; else delete cur[key];
    this._write(P.hl(this.me), cur, 'Выделение');
  },
  addAnniv({ title, date }) { this.sendEvent('anniv', { title, date }); },
  delAnniv(id) { this.sendEvent('anniv-del', { of: id }); },
  nudge() { // не чаще раза в 15 минут: напоминание — не спам
    const last = +localStorage.getItem('tandem.nudge') || 0;
    if (Date.now() - last < 15 * 60e3) return false;
    try { localStorage.setItem('tandem.nudge', String(Date.now())); } catch { /* без ограничения */ }
    this.sendEvent('nudge'); return true;
  },
  checkinOf(login, date = this.today) { return this.model.checkins[login]?.[date] || null; },
  // фото и аватар → адрес для <img>
  photoURL(path) { return path && this.repo ? this.repo.photoURL(path).catch(() => null) : Promise.resolve(null); },
  get translations() { return TRANSLATIONS; },
};
export { ckey, ekey, P };
