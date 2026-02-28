import { useState, useEffect, useCallback, useRef } from 'react';
import { useTasks } from '../context/TaskContext';

type PermissionState = NotificationPermission | 'unsupported';

export function useNotifications() {
  const { tasks } = useTasks();
  const swRef = useRef<ServiceWorkerRegistration | null>(null);

  const [permission, setPermission] = useState<PermissionState>(() => {
    if (typeof Notification === 'undefined') return 'unsupported';
    return Notification.permission;
  });

  // Register the service worker on mount
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw.js').then((reg) => {
      swRef.current = reg;
    });
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setPermission(result);
  }, []);

  // Send task count to SW and start/stop timer based on permission
  useEffect(() => {
    const sw = swRef.current?.active;
    if (!sw) return;

    const incompleteCount = tasks.filter((t) => !t.isCompleted).length;

    if (permission === 'granted') {
      sw.postMessage({ type: 'START_TIMER', count: incompleteCount });
    } else {
      sw.postMessage({ type: 'STOP_TIMER' });
    }
  }, [permission, tasks]);

  // Keep count in sync even when tasks change without permission change
  useEffect(() => {
    const sw = swRef.current?.active;
    if (!sw || permission !== 'granted') return;

    const incompleteCount = tasks.filter((t) => !t.isCompleted).length;
    sw.postMessage({ type: 'UPDATE_COUNT', count: incompleteCount });
  }, [tasks, permission]);

  return { permission, requestPermission };
}
