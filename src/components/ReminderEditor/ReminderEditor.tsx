import type { Reminder, OneTimeReminder, RecurringReminder } from '../../types';
import { formatReminder } from '../../lib/reminderUtils';
import styles from './ReminderEditor.module.css';

interface ReminderEditorProps {
  reminders: Reminder[];
  onChange: (reminders: Reminder[]) => void;
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function makeOneTime(): OneTimeReminder {
  return {
    id: crypto.randomUUID(),
    type: 'once',
    datetime: '',
    fired: false,
  };
}

function makeRecurring(): RecurringReminder {
  return {
    id: crypto.randomUUID(),
    type: 'recurring',
    time: '09:00',
    every: 1,
    unit: 'days',
  };
}

export function ReminderEditor({ reminders, onChange }: ReminderEditorProps) {
  const update = (id: string, patch: Partial<Reminder>) => {
    onChange(
      reminders.map((r) => (r.id === id ? { ...r, ...patch } as Reminder : r))
    );
  };

  const remove = (id: string) => {
    onChange(reminders.filter((r) => r.id !== id));
  };

  const addReminder = () => {
    onChange([...reminders, makeOneTime()]);
  };

  const switchType = (id: string, newType: 'once' | 'recurring') => {
    onChange(
      reminders.map((r) => {
        if (r.id !== id) return r;
        if (newType === 'once') return { ...makeOneTime(), id: r.id };
        return { ...makeRecurring(), id: r.id };
      })
    );
  };

  const toggleDay = (id: string, day: number, current: number[]) => {
    const next = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day];
    update(id, { daysOfWeek: next } as Partial<RecurringReminder>);
  };

  return (
    <div className={styles.editor}>
      {reminders.map((r) => (
        <div key={r.id} className={styles.row}>
          <div className={styles.rowHeader}>
            <div className={styles.typeToggle}>
              <button
                type="button"
                className={`${styles.typeBtn} ${r.type === 'once' ? styles.typeBtnActive : ''}`}
                onClick={() => switchType(r.id, 'once')}
              >
                One-time
              </button>
              <button
                type="button"
                className={`${styles.typeBtn} ${r.type === 'recurring' ? styles.typeBtnActive : ''}`}
                onClick={() => switchType(r.id, 'recurring')}
              >
                Recurring
              </button>
            </div>
            <button
              type="button"
              className={styles.deleteBtn}
              onClick={() => remove(r.id)}
              aria-label="Remove reminder"
            >
              &times;
            </button>
          </div>

          {r.type === 'once' && (
            <div className={styles.fields}>
              <input
                type="datetime-local"
                className={styles.input}
                value={r.datetime ? r.datetime.slice(0, 16) : ''}
                onChange={(e) => update(r.id, { datetime: new Date(e.target.value).toISOString() })}
              />
            </div>
          )}

          {r.type === 'recurring' && (
            <div className={styles.fields}>
              <div className={styles.intervalRow}>
                <span className={styles.fieldLabel}>Every</span>
                <input
                  type="number"
                  min={1}
                  className={`${styles.input} ${styles.numberInput}`}
                  value={r.every}
                  onChange={(e) =>
                    update(r.id, { every: Math.max(1, parseInt(e.target.value) || 1) } as Partial<RecurringReminder>)
                  }
                />
                <select
                  className={styles.select}
                  value={r.unit}
                  onChange={(e) => {
                    const unit = e.target.value as RecurringReminder['unit'];
                    const patch: Partial<RecurringReminder> = { unit };
                    if (unit === 'weeks' && !r.daysOfWeek) {
                      patch.daysOfWeek = [];
                    }
                    update(r.id, patch);
                  }}
                >
                  <option value="hours">hours</option>
                  <option value="days">days</option>
                  <option value="weeks">weeks</option>
                </select>
              </div>

              {r.unit !== 'hours' && (
                <div className={styles.intervalRow}>
                  <span className={styles.fieldLabel}>at</span>
                  <input
                    type="time"
                    className={styles.input}
                    value={r.time}
                    onChange={(e) => update(r.id, { time: e.target.value } as Partial<RecurringReminder>)}
                  />
                </div>
              )}

              {r.unit === 'weeks' && (
                <div className={styles.daysRow}>
                  {DAY_LABELS.map((label, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`${styles.dayBtn} ${(r.daysOfWeek ?? []).includes(i) ? styles.dayBtnActive : ''}`}
                      onClick={() => toggleDay(r.id, i, r.daysOfWeek ?? [])}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className={styles.summary}>{r.type === 'once' && !r.datetime ? 'Pick a date & time' : formatReminder(r)}</div>
        </div>
      ))}

      <button type="button" className={styles.addBtn} onClick={addReminder}>
        + Add reminder
      </button>
    </div>
  );
}
