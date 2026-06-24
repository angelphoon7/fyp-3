export const KEYS = {
  careTasks:      "kai_care_tasks",
  medications:    "kai_medications",
  appointments:   "kai_appointments",
  householdTasks: "kai_household_tasks",
  contacts:       "kai_contacts",
  shiftRequests:  "kai_shift_requests",
  communityPosts: "kai_community_posts",
  lastResetDate:  "kai_last_reset_date",
} as const;

// Call once on app load. If the stored date differs from today, wipes all
// daily-completion data (task logs and medication taken flags) and syncs the
// clean state back to Supabase. Returns true if a reset happened.
export function resetDailyData(): boolean {
  try {
    const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
    const stored = localStorage.getItem(KEYS.lastResetDate);
    if (stored === today) return false;

    // Reset care task logs
    const careTasks = load<{ id: string; name: string; icon: string; logs: unknown[] }[]>(KEYS.careTasks, []);
    const resetCare = careTasks.map(t => ({ ...t, logs: [] }));

    // Reset household task logs
    const houseTasks = load<{ id: string; name: string; icon: string; logs: unknown[] }[]>(KEYS.householdTasks, []);
    const resetHouse = houseTasks.map(t => ({ ...t, logs: [] }));

    // Reset medication taken flags
    const meds = load<{ id: string; name: string; dosage: string; schedules: { id: string; period: string; time: string; taken: boolean; takenAt?: string }[] }[]>(KEYS.medications, []);
    const resetMeds = meds.map(m => ({
      ...m,
      schedules: m.schedules.map(s => ({ ...s, taken: false, takenAt: undefined })),
    }));

    if (resetCare.length)  save(KEYS.careTasks,      resetCare);
    if (resetHouse.length) save(KEYS.householdTasks,  resetHouse);
    if (resetMeds.length)  save(KEYS.medications,     resetMeds);

    localStorage.setItem(KEYS.lastResetDate, today);
    return true;
  } catch {
    return false;
  }
}

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

// Fetches all state keys from Supabase.
// Only writes to localStorage (and returns) Supabase values for keys that are
// missing locally — localStorage is always the freshest write so we never
// overwrite it with potentially stale Supabase data.
export async function hydrate(): Promise<Record<string, any>> {
  try {
    const res = await fetch("/api/load-state");
    if (!res.ok) return {};
    const remote: Record<string, any> = await res.json();
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(remote)) {
      if (value === null || value === undefined) continue;
      const local = localStorage.getItem(key);
      if (!local) {
        // Nothing saved locally yet — bootstrap from Supabase
        localStorage.setItem(key, JSON.stringify(value));
        result[key] = value;
      } else {
        // Trust local over remote
        result[key] = JSON.parse(local);
      }
    }
    return result;
  } catch {
    return {};
  }
}
