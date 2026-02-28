import { useTasks } from '../../context/TaskContext';
import styles from './Header.module.css';

export function Header() {
  const { tasks } = useTasks();
  const total = tasks.length;
  const completed = tasks.filter((t) => t.isCompleted).length;

  return (
    <header className={styles.header}>
      <h1 className={styles.title}>Task Reminder</h1>
      {total > 0 && (
        <p className={styles.stats}>
          {total} created, {completed} completed
        </p>
      )}
    </header>
  );
}
