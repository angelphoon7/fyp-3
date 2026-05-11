// Lightweight localStorage store shared across feature pages.
// Each page writes its state here; the report page reads and aggregates.

export const KEYS = {
  careTasks:      "kai_care_tasks",
  medications:    "kai_medications",
  appointments:   "kai_appointments",
  householdTasks: "kai_household_tasks",
} as const;

export function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    // Push to Firestore so n8n and MCP servers have live data
    fetch("/api/push-state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    }).catch(() => {});
  } catch {}
}

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
