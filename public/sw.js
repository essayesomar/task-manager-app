const DB_NAME = 'task-reminder-sw';
const DB_STORE = 'meta';

// ── IndexedDB helpers (localStorage isn't available in service workers) ──

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(DB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveCount(count) {
  const db = await openDB();
  const tx = db.transaction(DB_STORE, 'readwrite');
  tx.objectStore(DB_STORE).put(count, 'incompleteCount');
}

async function getCount() {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(DB_STORE, 'readonly');
      const req = tx.objectStore(DB_STORE).get('incompleteCount');
      req.onsuccess = () => resolve(req.result || 0);
      req.onerror = () => resolve(0);
    });
  } catch {
    return 0;
  }
}

// ── Notification logic ──

async function showTaskNotification() {
  const count = await getCount();
  if (count === 0) return;

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
  const { type, count } = event.data;

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
