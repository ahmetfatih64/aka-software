export const prerender = false;
import type { APIRoute } from 'astro';
import { db, ChatSessions, ChatMessages } from 'astro:db';
import { eq } from 'astro:db';
import { corsHeaders } from '../../lib/cors';

const N8N_WEBHOOK =
  import.meta.env.N8N_WEBHOOK_URL ?? 'https://62.238.105.156.sslip.io/webhook/aka-chat';

export const OPTIONS: APIRoute = ({ request }) => {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
};

export const POST: APIRoute = async ({ request }) => {
  const cors = corsHeaders(request);

  let body: { message: string; sessionId?: string; pageContext?: string; mode?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Geçersiz istek.' }), {
      status: 400,
      headers: cors,
    });
  }

  const { message, sessionId = 'default', pageContext = 'homepage', mode = 'website' } = body;
  if (!message?.trim()) {
    return new Response(JSON.stringify({ error: 'Mesaj boş olamaz.' }), {
      status: 400,
      headers: cors,
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
        { status: 502, headers: cors }
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
      headers: cors,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Bilinmeyen hata.';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: cors,
    });
  }
};
