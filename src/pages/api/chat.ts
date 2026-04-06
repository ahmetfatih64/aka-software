import type { APIRoute } from 'astro';
import { db, ChatSessions, ChatMessages } from 'astro:db';
import { eq } from 'astro:db';

const N8N_WEBHOOK = 'https://akasoftware.app.n8n.cloud/webhook/aka-chat';

export const POST: APIRoute = async ({ request }) => {
  let body: { message: string; sessionId?: string; pageContext?: string; mode?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Geçersiz istek.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { message, sessionId = 'default', pageContext = 'homepage', mode = 'website' } = body;
  if (!message?.trim()) {
    return new Response(JSON.stringify({ error: 'Mesaj boş olamaz.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Detect language: only Turkish and English supported
  const turkishChars = /[çğıöşüÇĞİÖŞÜ]/;
  const turkishWords = /\b(merhaba|nasıl|hakkında|istiyorum|nedir|bilgi|için|lütfen|teşekkür|evet|hayır|proje|hizmet|fiyat|teklif|selam|ne kadar|kaça)\b/i;
  const lang = (turkishChars.test(message) || turkishWords.test(message)) ? 'tr' : 'en';

  // Ensure session exists
  const existing = (await db.select().from(ChatSessions).where(eq(ChatSessions.sessionId, sessionId))) as any[];
  if (existing.length === 0) {
    await db.insert(ChatSessions).values({
      sessionId,
      pageContext,
      mode,
    });
  }

  // Save user message
  await db.insert(ChatMessages).values({
    sessionId,
    role: 'user',
    message: message.trim(),
    pageContext,
  });

  try {
    const n8nRes = await fetch(N8N_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatInput: lang === 'en'
          ? '[IMPORTANT: Reply entirely in English] ' + message.trim()
          : message.trim(),
        message: lang === 'en'
          ? '[IMPORTANT: Reply entirely in English] ' + message.trim()
          : message.trim(),
        sessionId: sessionId || 'default',
        pageContext,
        mode,
        language: lang,
      }),
    });

    if (!n8nRes.ok) {
      return new Response(
        JSON.stringify({ error: 'AI servisi şu an yanıt vermiyor.' }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await n8nRes.json();

    const text =
      data?.output ??
      data?.text ??
      data?.message ??
      data?.response ??
      (Array.isArray(data) ? (data[0]?.output ?? data[0]?.text ?? data[0]?.message) : null) ??
      'Yanıt alınamadı.';

    const reply = String(text);

    // Save bot response
    await db.insert(ChatMessages).values({
      sessionId,
      role: 'bot',
      message: reply,
      pageContext,
    });

    return new Response(JSON.stringify({ text: reply }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Bilinmeyen hata.';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
