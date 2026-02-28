const DB_NAME = 'task-reminder-sw';
const DB_STORE = 'meta';
const DB_VERSION = 2;

// ── IndexedDB helpers (localStorage isn't available in service workers) ──

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveValue(key, value) {
  const db = await openDB();
  const tx = db.transaction(DB_STORE, 'readwrite');
  tx.objectStore(DB_STORE).put(value, key);
}

async function getValue(key) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(DB_STORE, 'readonly');
      const req = tx.objectStore(DB_STORE).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(undefined);
    });
  } catch {
    return undefined;
  }
}

// Legacy compat
async function saveCount(count) {
  await saveValue('incompleteCount', count);
}

async function getCount() {
  return (await getValue('incompleteCount')) || 0;
}

// ── Reminder checking (plain JS, mirrors reminderUtils.ts) ──

function sameMinute(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate() &&
    a.getHours() === b.getHours() &&
    a.getMinutes() === b.getMinutes()
  );
}

function parseTime(time) {
  const [h, m] = time.split(':').map(Number);
  return { hours: h, minutes: m };
}

const MS_PER_HOUR = 3600000;
const MS_PER_DAY = 86400000;

function shouldFireReminder(reminder, now) {
  if (reminder.type === 'once') {
    if (reminder.fired) return false;
    return sameMinute(now, new Date(reminder.datetime));
  }

  const r = reminder;

  if (r.unit === 'hours') {
    if (!r.lastFired) return true;
    return now.getTime() - new Date(r.lastFired).getTime() >= r.every * MS_PER_HOUR;
  }

  const { hours: targetH, minutes: targetM } = parseTime(r.time);
  if (now.getHours() !== targetH || now.getMinutes() !== targetM) return false;

  if (r.unit === 'days') {
    if (!r.lastFired) return true;
    return now.getTime() - new Date(r.lastFired).getTime() >= r.every * MS_PER_DAY;
  }

  // weeks
  if (r.daysOfWeek && !r.daysOfWeek.includes(now.getDay())) return false;
  if (!r.lastFired) return true;
  return now.getTime() - new Date(r.lastFired).getTime() >= r.every * 7 * MS_PER_DAY;
}

// ── Per-task reminder notification logic ──

async function checkScheduledReminders() {
  const schedule = await getValue('reminderSchedule');
  if (!schedule || !Array.isArray(schedule)) return;

  const now = new Date();

  for (const entry of schedule) {
    for (const reminder of entry.reminders) {
      if (shouldFireReminder(reminder, now)) {
        await self.registration.showNotification('Task Reminder', {
          body: entry.taskTitle,
          icon: '/vite.svg',
          tag: `reminder-${entry.taskId}-${reminder.id}`,
        });
      }
    }
  }
}

// ── Legacy generic notification (backward compat) ──

async function showTaskNotification() {
  const count = await getCount();
  if (count === 0) return;

  // Only show legacy notification if no per-task schedule exists
  const schedule = await getValue('reminderSchedule');
  if (schedule && Array.isArray(schedule) && schedule.length > 0) {
    // Use per-task reminders instead
    await checkScheduledReminders();
    return;
  }

  await self.registration.showNotification('Task Reminder', {
    body: `You have ${count} task${count === 1 ? '' : 's'} to do!`,
    icon: '/vite.svg',
    tag: 'task-reminder',
  });
}

// ── Timer aligned to clock minute ──

let timerId = null;

function startTimer() {
  stopTimer();
  const msUntilNextMinute =
    (60 - new Date().getSeconds()) * 1000 - new Date().getMilliseconds();

  timerId = setTimeout(() => {
    showTaskNotification();
    timerId = setInterval(showTaskNotification, 60 * 1000);
  }, msUntilNextMinute);
}

function stopTimer() {
  if (timerId !== null) {
    clearTimeout(timerId);
    clearInterval(timerId);
    timerId = null;
  }
}

// ── Events ──

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());

self.addEventListener('message', (event) => {
  const { type, count, schedule } = event.data;

  if (type === 'UPDATE_COUNT') {
    saveCount(count);
  }

  if (type === 'START_TIMER') {
    saveCount(count);
    startTimer();
  }

  if (type === 'STOP_TIMER') {
    stopTimer();
  }

  if (type === 'SYNC_REMINDERS') {
    saveValue('reminderSchedule', schedule);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      if (clients.length > 0) {
        return clients[0].focus();
      }
      return self.clients.openWindow('/');
    })
  );
});
