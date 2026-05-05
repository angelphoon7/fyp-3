// Lightweight localStorage store shared across feature pages.
// Each page writes its state here; the report page reads and aggregates.

export const KEYS = {
  careTasks:      "kai_care_tasks",
  medications:    "kai_medications",
  appointments:   "kai_appointments",
  householdTasks: "kai_household_tasks",
} as const;

export function save<T>(key: string, value: T): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
