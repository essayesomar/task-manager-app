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
    if (!stored) return [];
    const tasks: Task[] = JSON.parse(stored);
    // Migration: default missing reminders to []
    return tasks.map((t) => ({ ...t, reminders: t.reminders ?? [] }));
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
            reminders: action.payload.reminders ?? [],
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
    case 'SET_REMINDERS':
      return {
        tasks: state.tasks.map((task) =>
          task.id === action.payload.taskId
            ? { ...task, reminders: action.payload.reminders }
            : task
        ),
      };
    case 'MARK_REMINDER_FIRED':
      return {
        tasks: state.tasks.map((task) => {
          if (task.id !== action.payload.taskId) return task;
          return {
            ...task,
            reminders: task.reminders.map((r) => {
              if (r.id !== action.payload.reminderId) return r;
              if (r.type === 'once') {
                return { ...r, fired: true };
              }
              return { ...r, lastFired: new Date().toISOString() };
            }),
          };
        }),
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
