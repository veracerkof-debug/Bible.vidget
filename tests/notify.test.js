import { describe, it, expect } from 'vitest';
import { planFromAdded, planScheduled, localParts } from '../tools/notify-lib.mjs';

const members = { alice: { name: 'Alice', lang: 'ru', tz: 'Asia/Samarkand', remind: { on: true, hour: 20 } }, bob: { name: 'Bob', lang: 'en', tz: 'Asia/Jakarta', remind: { on: true, hour: 19 } } };
const files = {
  'u/alice/c/2026-11-19.json': { ref: { b: 'JOH', c: 3, v1: 16 } },
  'u/bob/a/c-2026-11-19.json': { of: 'alice' },
  'u/alice/e/1.json': { type: 'nudge' }, 'u/alice/e/2.json': { type: 'msg', text: 'Привет' },
  'u/alice/p/2026-11-19.jpg': null,
};
const read = (p) => files[p] ?? null;

describe('уведомления', () => {
  it('отчёт → партнёру на его языке; фото игнорируется', () => {
    const r = planFromAdded(Object.keys(files), read, members);
    const ci = r.find((x) => x.tag === 'c-alice');
    expect(ci.to).toBe('bob'); expect(ci.title).toBe('Alice'); expect(ci.body).toContain('John 3:16');
    expect(r.every((x) => x.to !== 'alice' || x.tag.endsWith('bob'))).toBe(true);
    expect(r.length).toBe(4);
  });
  it('подтверждение и «прочти»', () => {
    const r = planFromAdded(['u/bob/a/c-2026-11-19.json', 'u/alice/e/1.json'], read, members);
    expect(r[0]).toMatchObject({ to: 'alice', body: 'Отчёт подтверждён ✓' });
    expect(r[1]).toMatchObject({ to: 'bob', body: 'Time to read the Bible 📖' });
  });
  it('часы по поясу получателя', () => {
    const now = new Date('2026-11-19T15:10:00Z'); // Самарканд 20:10, Джакарта 22:10
    expect(localParts(now, 'Asia/Samarkand')).toEqual({ date: '2026-11-19', hour: 20 });
    const r = planScheduled({ now, members, hasCheckin: () => false });
    expect(r.map((x) => x.to)).toEqual(['alice']); expect(r[0].title).toBe('Время читать');
    expect(planScheduled({ now, members, hasCheckin: (l) => l === 'alice' }).length).toBe(0);
  });
  it('памятный день в 8 утра', () => {
    const now = new Date('2026-09-14T03:05:00Z'); // Самарканд 08:05
    const r = planScheduled({ now, members, hasCheckin: () => true, annivs: [{ id: 'x', date: '2025-09-14', title: 'Годовщина' }] });
    expect(r.map((x) => x.to)).toEqual(['alice']); expect(r[0].body).toBe('Годовщина');
  });
});
