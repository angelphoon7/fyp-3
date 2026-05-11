import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import twilio from "twilio";
import { z } from "zod";

const server = new McpServer({ name: "kai-twilio", version: "1.0.0" });

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

const FROM = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER ?? "+14155238886"}`;

// ── Tool 1: Send WhatsApp to a family member ──────────────────────────────────
server.tool(
  "send_whatsapp",
  "Send a WhatsApp message to a family member or caregiver",
  {
    to:      z.string().describe("Phone number in E.164 format e.g. +60123456789"),
    message: z.string().describe("The message to send"),
  },
  async ({ to, message }) => {
    const msg = await client.messages.create({
      from: FROM,
      to:   `whatsapp:${to}`,
      body: message,
    });
    return {
      content: [{ type: "text", text: `✅ Sent to ${to} (SID: ${msg.sid})` }],
    };
  }
);

// ── Tool 2: Send to a named list of contacts ──────────────────────────────────
server.tool(
  "send_whatsapp_to_family",
  "Send the same WhatsApp message to all configured family contacts",
  {
    message: z.string().describe("The message to broadcast"),
  },
  async ({ message }) => {
    const contacts = (process.env.FAMILY_CONTACTS ?? "")
      .split(",")
      .map(c => c.trim())
      .filter(Boolean);

    if (contacts.length === 0) {
      return { content: [{ type: "text", text: "⚠️ No FAMILY_CONTACTS configured in environment." }] };
    }

    const results = await Promise.allSettled(
      contacts.map(to =>
        client.messages.create({ from: FROM, to: `whatsapp:${to}`, body: message })
      )
    );

    const sent   = results.filter(r => r.status === "fulfilled").length;
    const failed = results.filter(r => r.status === "rejected").length;

    return {
      content: [{
        type: "text",
        text: `✅ Sent to ${sent} contact(s)${failed > 0 ? `, ⚠️ ${failed} failed` : ""}.`,
      }],
    };
  }
);

// ── Tool 3: Check if a number is reachable via WhatsApp ───────────────────────
server.tool(
  "lookup_whatsapp_number",
  "Check if a phone number can receive WhatsApp messages via Twilio",
  {
    phone: z.string().describe("Phone number in E.164 format"),
  },
  async ({ phone }) => {
    try {
      const lookup = await client.lookups.v2.phoneNumbers(phone).fetch({ fields: "line_type_intelligence" });
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ phone, valid: lookup.valid, lineType: lookup.lineTypeIntelligence }),
        }],
      };
    } catch {
      return { content: [{ type: "text", text: `⚠️ Could not look up ${phone}` }] };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
