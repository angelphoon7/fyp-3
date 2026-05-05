// Shared Vertex AI Gemini helper — uses Application Default Credentials (ADC),
// same auth mechanism as Cloud Vision. No API key required.

import { GoogleAuth } from "google-auth-library";

const LOCATION = "us-central1";
const MODEL    = "gemini-2.5-flash";

let _auth: GoogleAuth | null = null;

function getAuth() {
  if (!_auth) {
    _auth = new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/cloud-platform"] });
  }
  return _auth;
}

type Part =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

export async function gemini(parts: Part[]): Promise<string> {
  const auth      = getAuth();
  const projectId = await auth.getProjectId();
  const client    = await auth.getClient();
  const { token } = await client.getAccessToken();
  if (!token) throw new Error("ADC: failed to obtain access token.");

  const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${LOCATION}/publishers/google/models/${MODEL}:generateContent`;

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts }],
      generationConfig: { responseMimeType: "application/json" },
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Vertex AI ${res.status}: ${body.substring(0, 200)}`);
  }

  const data = await res.json();
  const raw  = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
}
