import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { chatIds, message } = await req.json();

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return NextResponse.json({ error: "Bot token not configured" }, { status: 500 });
  if (!chatIds?.length || !message) return NextResponse.json({ error: "Missing chatIds or message" }, { status: 400 });

  await Promise.allSettled(
    (chatIds as string[]).map((chatId) =>
      fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: message }),
      })
    )
  );

  return NextResponse.json({ ok: true });
}
