import type { Task } from '../../types';
import { TaskItem } from '../TaskItem/TaskItem';
import { EmptyState } from '../EmptyState/EmptyState';
import styles from './TaskList.module.css';

interface TaskListProps {
  title: string;
  tasks: Task[];
  emptyMessage: string;
}

export function TaskList({ title, tasks, emptyMessage }: TaskListProps) {
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>{title}</h2>
      {tasks.length === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <div className={styles.list}>
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      )}
    </section>
  );
}
