import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTasks } from '../../context/TaskContext';
import { ReminderEditor } from '../ReminderEditor/ReminderEditor';
import type { Reminder } from '../../types';
import styles from './TaskForm.module.css';

export function TaskForm() {
  const { dispatch } = useTasks();
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reminders, setReminders] = useState<Reminder[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    dispatch({
      type: 'ADD_TASK',
      payload: {
        title: trimmedTitle,
        description: description.trim(),
        reminders,
      },
    });
    setTitle('');
    setDescription('');
    setReminders([]);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        className={styles.input}
        type="text"
        placeholder={t('taskForm.titlePlaceholder')}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <textarea
        className={styles.textarea}
        placeholder={t('taskForm.descPlaceholder')}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
      />
      <div className={styles.reminderSection}>
        <span className={styles.reminderLabel}>{t('taskForm.remindersLabel')}</span>
        <ReminderEditor reminders={reminders} onChange={setReminders} />
      </div>
      <button className={styles.button} type="submit">
        {t('taskForm.addTask')}
      </button>
    </form>
  );
}
