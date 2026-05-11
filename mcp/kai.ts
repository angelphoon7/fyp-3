import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server  = new McpServer({ name: "kai-app", version: "1.0.0" });
const BASE    = process.env.KAI_APP_URL ?? "http://localhost:3000";

async function get(path: string) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`KAI API ${res.status}: ${path}`);
  return res.json();
}

// ── Tool 1: Full daily care summary ──────────────────────────────────────────
server.tool(
  "get_daily_summary",
  "Get today's full care summary — tasks completed, medications taken, upcoming appointments, household tasks",
  {},
  async () => {
    const data = await get("/api/daily-summary");
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// ── Tool 2: Only pending medications ─────────────────────────────────────────
server.tool(
  "get_pending_medications",
  "Get list of medications not yet taken today with their scheduled times",
  {},
  async () => {
    const data = await get("/api/daily-summary");
    const pending = data.medication?.pending ?? [];
    if (pending.length === 0) {
      return { content: [{ type: "text", text: "✅ All medications taken today." }] };
    }
    const formatted = pending
      .map((m: any) => `• ${m.name} ${m.dosage} — ${m.period} (${m.time})`)
      .join("\n");
    return { content: [{ type: "text", text: `Pending medications:\n${formatted}` }] };
  }
);

// ── Tool 3: Upcoming appointments ────────────────────────────────────────────
server.tool(
  "get_upcoming_appointments",
  "Get the next scheduled hospital or clinic appointments",
  {
    limit: z.number().default(3).describe("How many appointments to return"),
  },
  async ({ limit }) => {
    const data  = await get("/api/daily-summary");
    const appts = (data.appointments?.upcoming ?? []).slice(0, limit);
    if (appts.length === 0) {
      return { content: [{ type: "text", text: "No upcoming appointments." }] };
    }
    const formatted = appts
      .map((a: any) => `• ${a.hospital} — ${a.date} at ${a.time}${a.notes ? ` (${a.notes})` : ""}`)
      .join("\n");
    return { content: [{ type: "text", text: `Upcoming appointments:\n${formatted}` }] };
  }
);

// ── Tool 4: Financial / receipt summary ──────────────────────────────────────
server.tool(
  "get_financial_summary",
  "Get all scanned receipts, spending totals by category, and claim notes",
  {},
  async () => {
    const data = await get("/api/financial-export");
    const summary = {
      grandTotal:     data.grandTotal,
      groceryTotal:   data.groceryTotal,
      medicalTotal:   data.medicalTotal,
      currency:       data.currency,
      groceryCount:   data.groceryReceipts?.length ?? 0,
      medicalCount:   data.medicalReceipts?.length ?? 0,
      latestReceipts: [
        ...(data.groceryReceipts ?? []).slice(0, 2).map((r: any) => ({ type: "grocery", store: r.store, total: r.total, date: r.date })),
        ...(data.medicalReceipts ?? []).slice(0, 2).map((r: any) => ({ type: "medical", hospital: r.hospital, total: r.total, date: r.date })),
      ],
    };
    return { content: [{ type: "text", text: JSON.stringify(summary, null, 2) }] };
  }
);

// ── Tool 5: Generate personalised family update message ───────────────────────
server.tool(
  "compose_daily_update",
  "Read today's data and compose a warm, friendly WhatsApp update message for the family",
  {
    patientName:   z.string().describe("Name of the patient"),
    caregiverName: z.string().describe("Name of the caregiver"),
  },
  async ({ patientName, caregiverName }) => {
    const data = await get("/api/daily-summary");

    const careStatus  = `${data.care.completed}/${data.care.total} care tasks done`;
    const medStatus   = data.medication.total > 0
      ? `${data.medication.taken}/${data.medication.total} medications taken`
      : "no medications scheduled";
    const pendingMeds = (data.medication.pending ?? []).map((m: any) => m.name).join(", ");
    const nextAppt    = data.appointments.upcoming[0]
      ? `Next appointment: ${data.appointments.upcoming[0].hospital} on ${data.appointments.upcoming[0].date}`
      : "No upcoming appointments";

    const message = [
      `Hi! Here's ${patientName}'s update for today 🌟`,
      ``,
      `✅ Care: ${careStatus}`,
      `💊 Medication: ${medStatus}${pendingMeds ? ` (${pendingMeds} pending)` : ""}`,
      `🏠 Household: ${data.household.completed}/${data.household.total} tasks done`,
      `📅 ${nextAppt}`,
      ``,
      `Overall today: ${data.score}/100`,
      ``,
      `— ${caregiverName} via KAI`,
    ].join("\n");

    return { content: [{ type: "text", text: message }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
