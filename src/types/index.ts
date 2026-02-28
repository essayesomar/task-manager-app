export interface Task {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  createdAt: string;
}

export type TaskAction =
  | { type: 'ADD_TASK'; payload: { title: string; description: string } }
  | { type: 'TOGGLE_TASK'; payload: { id: string } };
