import { useTranslation } from 'react-i18next';
import { useTasks } from './context/TaskContext';
import { Header } from './components/Header/Header';
import { NotificationBanner } from './components/NotificationBanner/NotificationBanner';
import { TaskForm } from './components/TaskForm/TaskForm';
import { TaskList } from './components/TaskList/TaskList';

function App() {
  const { tasks } = useTasks();
  const { t } = useTranslation();

  const incompleteTasks = tasks.filter((t) => !t.isCompleted);
  const completedTasks = tasks.filter((t) => t.isCompleted);

  return (
    <>
      <Header />
      <NotificationBanner />
      <TaskForm />
      <TaskList
        title={t('tasks.todo')}
        tasks={incompleteTasks}
        emptyMessage={t('tasks.emptyTodo')}
      />
      {completedTasks.length > 0 && (
        <TaskList
          title={t('tasks.completed')}
          tasks={completedTasks}
          emptyMessage=""
        />
      )}
    </>
  );
}

export default App;
