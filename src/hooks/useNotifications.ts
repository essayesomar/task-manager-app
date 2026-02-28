import { useState, useEffect, useCallback } from 'react';
import { useTasks } from '../context/TaskContext';

type PermissionState = NotificationPermission | 'unsupported';

function getSwActive(): Promise<ServiceWorker | null> {
  if (!('serviceWorker' in navigator)) return Promise.resolve(null);
  return navigator.serviceWorker.ready.then((reg) => reg.active);
}

export function useNotifications() {
  const { tasks } = useTasks();

  const [permission, setPermission] = useState<PermissionState>(() => {
    if (typeof Notification === 'undefined') return 'unsupported';
    return Notification.permission;
  });

  // Register the service worker once
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setPermission(result);
  }, []);

  // Keep the SW in sync with the current task count
  useEffect(() => {
    if (permission !== 'granted') return;

    const incompleteCount = tasks.filter((t) => !t.isCompleted).length;

    getSwActive().then((sw) => {
      if (sw) {
        sw.postMessage({ type: 'START_TIMER', count: incompleteCount });
      }
    });

    return () => {
      getSwActive().then((sw) => {
        if (sw) sw.postMessage({ type: 'STOP_TIMER' });
      });
    };
  }, [permission, tasks]);

  // Fallback: in-page timer for when SW timer gets killed
  useEffect(() => {
    if (permission !== 'granted') return;

    const sendNotification = () => {
      const incompleteCount = tasks.filter((t) => !t.isCompleted).length;
      if (incompleteCount === 0) return;

      // Use SW notification if available, otherwise direct
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification('Task Reminder', {
            body: `You have ${incompleteCount} task${incompleteCount === 1 ? '' : 's'} to do!`,
            icon: '/vite.svg',
            tag: 'task-reminder',
          });
        });
      } else {
        new Notification('Task Reminder', {
          body: `You have ${incompleteCount} task${incompleteCount === 1 ? '' : 's'} to do!`,
        });
      }
    };

    const msUntilNextMinute =
      (60 - new Date().getSeconds()) * 1000 - new Date().getMilliseconds();
    let intervalId: number;

    const timeoutId = window.setTimeout(() => {
      sendNotification();
      intervalId = window.setInterval(sendNotification, 60 * 1000);
    }, msUntilNextMinute);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [permission, tasks]);

  return { permission, requestPermission };
}
