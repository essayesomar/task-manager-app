import { createContext, useContext, useReducer, useEffect, useRef } from 'react';
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
    case 'SET_TASKS':
      return { tasks: action.payload };
    default:
      return state;
  }
}

export function TaskProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(taskReducer, { tasks: [] });
  const isLoaded = useRef(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        dispatch({ type: 'SET_TASKS', payload: JSON.parse(stored) });
      }
    } catch {
      // Ignore parse errors
    }
    isLoaded.current = true;
  }, []);

  // Save to localStorage on every change (after initial load)
  useEffect(() => {
    if (isLoaded.current) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
    }
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
