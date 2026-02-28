import { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Task, TaskAction } from '../types';

const STORAGE_KEY = 'task-manager-tasks';

interface TaskState {
  tasks: Task[];
}

interface TaskContextValue {
  tasks: Task[];
  dispatch: React.Dispatch<TaskAction>;
}

const TaskContext = createContext<TaskContextValue | null>(null);

function loadTasks(): Task[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function taskReducer(state: TaskState, action: TaskAction): TaskState {
  switch (action.type) {
    case 'ADD_TASK':
      return {
        tasks: [
          {
            id: crypto.randomUUID(),
            title: action.payload.title,
            description: action.payload.description,
            isCompleted: false,
            createdAt: new Date().toISOString(),
          },
          ...state.tasks,
        ],
      };
    case 'TOGGLE_TASK':
      return {
        tasks: state.tasks.map((task) =>
          task.id === action.payload.id
            ? { ...task, isCompleted: !task.isCompleted }
            : task
        ),
      };
    default:
      return state;
  }
}

export function TaskProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(taskReducer, { tasks: loadTasks() });

  // Save to localStorage on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
  }, [state.tasks]);

  return (
    <TaskContext.Provider value={{ tasks: state.tasks, dispatch }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
}
