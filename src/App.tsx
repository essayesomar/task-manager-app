import { useTasks } from './context/TaskContext';
import { Header } from './components/Header/Header';
import { NotificationBanner } from './components/NotificationBanner/NotificationBanner';
import { TaskForm } from './components/TaskForm/TaskForm';
import { TaskList } from './components/TaskList/TaskList';

function App() {
  const { tasks } = useTasks();

  const incompleteTasks = tasks.filter((t) => !t.isCompleted);
  const completedTasks = tasks.filter((t) => t.isCompleted);

  return (
    <>
      <Header />
      <NotificationBanner />
      <TaskForm />
      <TaskList
        title="To Do"
        tasks={incompleteTasks}
        emptyMessage="No tasks yet. Add one above!"
      />
      {completedTasks.length > 0 && (
        <TaskList
          title="Completed"
          tasks={completedTasks}
          emptyMessage=""
        />
      )}
    </>
  );
}

export default App;
