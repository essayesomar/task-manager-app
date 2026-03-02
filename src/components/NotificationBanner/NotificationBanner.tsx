import { useTranslation } from 'react-i18next';
import { useNotifications } from '../../hooks/useNotifications';
import styles from './NotificationBanner.module.css';

export function NotificationBanner() {
  const { permission, requestPermission } = useNotifications();
  const { t } = useTranslation();

  if (permission === 'granted' || permission === 'unsupported') return null;

  return (
    <div className={styles.banner}>
      {permission === 'default' && (
        <>
          <p className={styles.text}>{t('notifications.enablePrompt')}</p>
          <button className={styles.button} onClick={requestPermission}>
            {t('notifications.enableBtn')}
          </button>
        </>
      )}
      {permission === 'denied' && (
        <p className={styles.text}>{t('notifications.blocked')}</p>
      )}
    </div>
  );
}
