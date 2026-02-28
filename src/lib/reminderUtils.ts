import type { Reminder, OneTimeReminder, RecurringReminder } from '../types';

function sameMinute(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate() &&
    a.getHours() === b.getHours() &&
    a.getMinutes() === b.getMinutes()
  );
}

function parseTime(time: string): { hours: number; minutes: number } {
  const [h, m] = time.split(':').map(Number);
  return { hours: h, minutes: m };
}

function diffMs(a: Date, b: Date): number {
  return a.getTime() - b.getTime();
}

const MS_PER_HOUR = 3600_000;
const MS_PER_DAY = 86_400_000;

function shouldFireOnce(r: OneTimeReminder, now: Date): boolean {
  if (r.fired) return false;
  return sameMinute(now, new Date(r.datetime));
}

function shouldFireRecurring(r: RecurringReminder, now: Date): boolean {
  const { hours: nowH, minutes: nowM } = { hours: now.getHours(), minutes: now.getMinutes() };

  if (r.unit === 'hours') {
    if (!r.lastFired) return true;
    return diffMs(now, new Date(r.lastFired)) >= r.every * MS_PER_HOUR;
  }

  // For days/weeks, the time must match
  const { hours: targetH, minutes: targetM } = parseTime(r.time);
  if (nowH !== targetH || nowM !== targetM) return false;

  if (r.unit === 'days') {
    if (!r.lastFired) return true;
    return diffMs(now, new Date(r.lastFired)) >= r.every * MS_PER_DAY;
  }

  // weeks
  if (r.daysOfWeek && !r.daysOfWeek.includes(now.getDay())) return false;
  if (!r.lastFired) return true;
  return diffMs(now, new Date(r.lastFired)) >= r.every * 7 * MS_PER_DAY;
}

export function shouldFireReminder(reminder: Reminder, now: Date): boolean {
  if (reminder.type === 'once') return shouldFireOnce(reminder, now);
  return shouldFireRecurring(reminder, now);
}

export function getNextFireTime(reminder: Reminder, now: Date): Date | null {
  if (reminder.type === 'once') {
    if (reminder.fired) return null;
    const dt = new Date(reminder.datetime);
    return dt > now ? dt : null;
  }

  const r = reminder;

  if (r.unit === 'hours') {
    if (!r.lastFired) return now; // fires immediately
    const next = new Date(new Date(r.lastFired).getTime() + r.every * MS_PER_HOUR);
    return next > now ? next : now;
  }

  const { hours, minutes } = parseTime(r.time);

  if (r.unit === 'days') {
    // Next occurrence of the target time that's >= every days after lastFired
    const candidate = new Date(now);
    candidate.setHours(hours, minutes, 0, 0);
    if (candidate <= now) candidate.setDate(candidate.getDate() + 1);

    if (r.lastFired) {
      const earliest = new Date(new Date(r.lastFired).getTime() + r.every * MS_PER_DAY);
      earliest.setHours(hours, minutes, 0, 0);
      if (earliest > candidate) return earliest;
    }
    return candidate;
  }

  // weeks — find next matching day-of-week at the target time
  if (!r.daysOfWeek || r.daysOfWeek.length === 0) return null;

  for (let offset = 0; offset <= 14; offset++) {
    const candidate = new Date(now);
    candidate.setDate(candidate.getDate() + offset);
    candidate.setHours(hours, minutes, 0, 0);
    if (candidate <= now) continue;
    if (!r.daysOfWeek.includes(candidate.getDay())) continue;

    if (r.lastFired) {
      const earliest = new Date(new Date(r.lastFired).getTime() + r.every * 7 * MS_PER_DAY);
      if (candidate < earliest) continue;
    }
    return candidate;
  }

  return null;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function formatReminder(reminder: Reminder): string {
  if (reminder.type === 'once') {
    const d = new Date(reminder.datetime);
    const month = d.toLocaleString('en-US', { month: 'short' });
    const day = d.getDate();
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${month} ${day} at ${h}:${m}`;
  }

  const r = reminder;
  const unit = r.every === 1 ? r.unit.replace(/s$/, '') : `${r.every} ${r.unit}`;

  if (r.unit === 'hours') {
    return `Every ${unit}`;
  }

  const label = `Every ${unit} at ${r.time}`;

  if (r.unit === 'weeks' && r.daysOfWeek && r.daysOfWeek.length > 0) {
    const days = r.daysOfWeek
      .slice()
      .sort((a, b) => a - b)
      .map((d) => DAY_NAMES[d])
      .join(', ');
    return `${label} (${days})`;
  }

  return label;
}
