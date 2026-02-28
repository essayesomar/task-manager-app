import { useState, useEffect, useCallback, useRef } from 'react';
import { useTasks } from '../context/TaskContext';
import { shouldFireReminder } from '../lib/reminderUtils';

type PermissionState = NotificationPermission | 'unsupported';

function getSwActive(): Promise<ServiceWorker | null> {
  if (!('serviceWorker' in navigator)) return Promise.resolve(null);
  return navigator.serviceWorker.ready.then((reg) => reg.active);
}

export function useNotifications() {
  const { tasks, dispatch } = useTasks();

  const [permission, setPermission] = useState<PermissionState>(() => {
    if (typeof Notification === 'undefined') return 'unsupported';
    return Notification.permission;
  });

  // Keep a ref so the interval callback always sees current tasks
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

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

  // Sync reminder data to the service worker whenever tasks change
  useEffect(() => {
    if (permission !== 'granted') return;

    const schedule = tasks
      .filter((t) => !t.isCompleted && t.reminders.length > 0)
      .map((t) => ({
        taskId: t.id,
        taskTitle: t.title,
        reminders: t.reminders,
        createdAt: t.createdAt,
      }));

    getSwActive().then((sw) => {
      if (sw) {
        sw.postMessage({ type: 'SYNC_REMINDERS', schedule });
        // Also keep legacy START_TIMER for backward compat during transition
        const incompleteCount = tasks.filter((t) => !t.isCompleted).length;
        sw.postMessage({ type: 'START_TIMER', count: incompleteCount });
      }
    });

    return () => {
      getSwActive().then((sw) => {
        if (sw) sw.postMessage({ type: 'STOP_TIMER' });
      });
    };
  }, [permission, tasks]);

  // In-page timer: check reminders every minute (aligned to clock minute)
  useEffect(() => {
    if (permission !== 'granted') return;

    const checkReminders = () => {
      const now = new Date();
      const currentTasks = tasksRef.current;

      for (const task of currentTasks) {
        if (task.isCompleted) continue;
        for (const reminder of task.reminders ?? []) {
          if (shouldFireReminder(reminder, now)) {
            // Show notification with task title
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.ready.then((reg) => {
                reg.showNotification('Task Reminder', {
                  body: task.title,
                  icon: '/vite.svg',
                  tag: `reminder-${task.id}-${reminder.id}`,
                });
              });
            } else {
              new Notification('Task Reminder', {
                body: task.title,
              });
            }

            // Mark reminder as fired
            dispatch({
              type: 'MARK_REMINDER_FIRED',
              payload: { taskId: task.id, reminderId: reminder.id },
            });
          }
        }
      }
    };

    const msUntilNextMinute =
      (60 - new Date().getSeconds()) * 1000 - new Date().getMilliseconds();
    let intervalId: number;

    const timeoutId = window.setTimeout(() => {
      checkReminders();
      intervalId = window.setInterval(checkReminders, 60 * 1000);
    }, msUntilNextMinute);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [permission, dispatch]);

  return { permission, requestPermission };
}
