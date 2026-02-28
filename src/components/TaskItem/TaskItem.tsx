import { useState } from 'react';
import { useTasks } from '../../context/TaskContext';
import { ReminderEditor } from '../ReminderEditor/ReminderEditor';
import type { Task, Reminder } from '../../types';
import styles from './TaskItem.module.css';

interface TaskItemProps {
  task: Task;
}

export function TaskItem({ task }: TaskItemProps) {
  const { dispatch } = useTasks();
  const [showReminders, setShowReminders] = useState(false);

  const activeReminderCount = (task.reminders ?? []).filter(
    (r) => !(r.type === 'once' && r.fired)
  ).length;

  const handleRemindersChange = (reminders: Reminder[]) => {
    dispatch({
      type: 'SET_REMINDERS',
      payload: { taskId: task.id, reminders },
    });
  };

  return (
    <div className={`${styles.item} ${task.isCompleted ? styles.completed : ''}`}>
      <div className={styles.topRow}>
        <label className={styles.label}>
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={task.isCompleted}
            onChange={() =>
              dispatch({ type: 'TOGGLE_TASK', payload: { id: task.id } })
            }
          />
          <span className={styles.title}>{task.title}</span>
        </label>
        <button
          type="button"
          className={`${styles.bellBtn} ${activeReminderCount > 0 ? styles.bellActive : ''}`}
          onClick={() => setShowReminders((v) => !v)}
          aria-label="Toggle reminders"
        >
          <svg
            className={styles.bellIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {activeReminderCount > 0 && (
            <span className={styles.badge}>{activeReminderCount}</span>
          )}
        </button>
      </div>
      {task.description && (
        <p className={styles.description}>{task.description}</p>
      )}
      {showReminders && (
        <div className={styles.reminderPanel}>
          <ReminderEditor
            reminders={task.reminders ?? []}
            onChange={handleRemindersChange}
          />
        </div>
      )}
    </div>
  );
}
