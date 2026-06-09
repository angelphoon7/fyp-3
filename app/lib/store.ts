export const KEYS = {
  careTasks:      "kai_care_tasks",
  medications:    "kai_medications",
  appointments:   "kai_appointments",
  householdTasks: "kai_household_tasks",
  contacts:       "kai_contacts",
} as const;

export function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
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

// Fetches all state keys from Supabase and writes them into localStorage.
// Returns the data so callers can update React state directly.
export async function hydrate(): Promise<Record<string, any>> {
  try {
    const res = await fetch("/api/load-state");
    if (!res.ok) return {};
    const data: Record<string, any> = await res.json();
    for (const [key, value] of Object.entries(data)) {
      if (value !== null && value !== undefined) {
        localStorage.setItem(key, JSON.stringify(value));
      }
    }
    return data;
  } catch {
    return {};
  }
}
