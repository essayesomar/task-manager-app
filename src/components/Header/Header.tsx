import { useTranslation } from 'react-i18next';
import { useTasks } from '../../context/TaskContext';
import { LanguagePicker } from '../LanguagePicker/LanguagePicker';
import styles from './Header.module.css';

export function Header() {
  const { tasks } = useTasks();
  const { t } = useTranslation();
  const total = tasks.length;
  const completed = tasks.filter((t) => t.isCompleted).length;

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <div className={styles.brand}>
          <svg className={styles.logo} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <defs>
              <linearGradient id="hg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="32" height="32" rx="7" ry="7" fill="url(#hg)" />
            <text x="16" y="22" fontFamily="'Arial Black', Arial, sans-serif" fontWeight="900" fontSize="20" textAnchor="middle" fill="white">S</text>
          </svg>
          <h1 className={styles.title}>Skouza</h1>
        </div>
        {total > 0 && (
          <p className={styles.stats}>
            {t('header.stats', { total, completed })}
          </p>
        )}
      </div>
      <div className={styles.right}>
        <LanguagePicker />
      </div>
    </header>
  );
}
