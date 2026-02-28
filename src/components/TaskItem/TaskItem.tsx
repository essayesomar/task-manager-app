import { useTasks } from '../../context/TaskContext';
import type { Task } from '../../types';
import styles from './TaskItem.module.css';

interface TaskItemProps {
  task: Task;
}

export function TaskItem({ task }: TaskItemProps) {
  const { dispatch } = useTasks();

  return (
    <div className={`${styles.item} ${task.isCompleted ? styles.completed : ''}`}>
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
      {task.description && (
        <p className={styles.description}>{task.description}</p>
      )}
    </div>
  );
}
