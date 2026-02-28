import { useNotifications } from '../../hooks/useNotifications';
import styles from './NotificationBanner.module.css';

export function NotificationBanner() {
  const { permission, requestPermission } = useNotifications();

  if (permission === 'granted' || permission === 'unsupported') return null;

  return (
    <div className={styles.banner}>
      {permission === 'default' && (
        <>
          <p className={styles.text}>
            Enable notifications to get hourly reminders of your pending tasks.
          </p>
          <button className={styles.button} onClick={requestPermission}>
            Enable Reminders
          </button>
        </>
      )}
      {permission === 'denied' && (
        <p className={styles.text}>
          Notifications are blocked. Please enable them in your browser settings
          to receive task reminders.
        </p>
      )}
    </div>
  );
}
