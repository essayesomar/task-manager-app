import { useTranslation } from 'react-i18next';
import styles from './LanguagePicker.module.css';

const LANGS = ['EN', 'FR'] as const;

export function LanguagePicker() {
  const { i18n } = useTranslation();
  const current = i18n.language.toUpperCase().slice(0, 2);

  const handleChange = (lang: string) => {
    const lower = lang.toLowerCase();
    i18n.changeLanguage(lower);
    localStorage.setItem('skouza-lang', lower);
  };

  return (
    <div className={styles.picker}>
      {LANGS.map((lang) => (
        <button
          key={lang}
          type="button"
          className={`${styles.pill} ${current === lang ? styles.pillActive : ''}`}
          onClick={() => handleChange(lang)}
        >
          {lang}
        </button>
      ))}
    </div>
  );
}
