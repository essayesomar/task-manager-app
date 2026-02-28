import { useState } from 'react';
import { useTasks } from '../../context/TaskContext';
import styles from './TaskForm.module.css';

export function TaskForm() {
  const { dispatch } = useTasks();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    dispatch({
      type: 'ADD_TASK',
      payload: { title: trimmedTitle, description: description.trim() },
    });
    setTitle('');
    setDescription('');
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        className={styles.input}
        type="text"
        placeholder="Task title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <textarea
        className={styles.textarea}
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
      />
      <button className={styles.button} type="submit">
        Add Task
      </button>
    </form>
  );
}
