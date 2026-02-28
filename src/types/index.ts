export interface ReminderBase {
  id: string;
}

export interface OneTimeReminder extends ReminderBase {
  type: 'once';
  datetime: string;   // ISO string — specific date & time
  fired: boolean;     // true after it fires, prevents re-firing
}

export interface RecurringReminder extends ReminderBase {
  type: 'recurring';
  time: string;           // "HH:mm" — time of day to fire (ignored when unit='hours')
  every: number;          // interval count (e.g., 2)
  unit: 'hours' | 'days' | 'weeks';
  daysOfWeek?: number[];  // 0=Sun..6=Sat, only when unit='weeks'
  lastFired?: string;     // ISO string, tracks last fire to enforce interval
}

export type Reminder = OneTimeReminder | RecurringReminder;

export interface Task {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  createdAt: string;
  reminders: Reminder[];
}

export type TaskAction =
  | { type: 'ADD_TASK'; payload: { title: string; description: string; reminders?: Reminder[] } }
  | { type: 'TOGGLE_TASK'; payload: { id: string } }
  | { type: 'SET_REMINDERS'; payload: { taskId: string; reminders: Reminder[] } }
  | { type: 'MARK_REMINDER_FIRED'; payload: { taskId: string; reminderId: string } };
