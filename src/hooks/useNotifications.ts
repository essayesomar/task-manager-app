import { useState, useEffect, useCallback } from 'react';
import { useTasks } from '../context/TaskContext';

type PermissionState = NotificationPermission | 'unsupported';

export function useNotifications() {
  const { tasks } = useTasks();

  const [permission, setPermission] = useState<PermissionState>(() => {
    if (typeof Notification === 'undefined') return 'unsupported';
    return Notification.permission;
  });

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setPermission(result);
  }, []);

  // Hourly notification interval
  useEffect(() => {
    if (permission !== 'granted') return;

    const sendNotification = () => {
      const incompleteCount = tasks.filter((t) => !t.isCompleted).length;
      if (incompleteCount === 0) return;

      new Notification('Task Reminder', {
        body: `You have ${incompleteCount} task${incompleteCount === 1 ? '' : 's'} to do!`,
      });
    };

    const intervalId = setInterval(sendNotification, 60 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [permission, tasks]);

  return { permission, requestPermission };
}
