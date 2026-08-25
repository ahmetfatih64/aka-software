export const prerender = false;
import type { APIRoute } from 'astro';
import { db, ChatSessions, ChatMessages } from 'astro:db';
import { eq } from 'astro:db';
import { corsHeaders } from '../../lib/cors';

const N8N_WEBHOOK =
  import.meta.env.N8N_WEBHOOK_URL ?? 'https://62.238.105.156.sslip.io/webhook/aka-chat';

type Lang = 'tr' | 'en';
const SUPPORTED_LANGS: Lang[] = ['tr', 'en'];
const DEFAULT_LANG: Lang = 'tr';

/**
 * The site language picked by the visitor is authoritative. Guessing from the
 * message text alone misclassifies short or diacritic-free Turkish ("Ne zaman
 * teslim edersiniz"), which used to flip the assistant into English mid-chat.
 * The heuristic below is only a fallback for clients that send no language.
 */
function guessLang(message: string): Lang {
  const turkishChars = /[çğıöşüÇĞİÖŞÜ]/;
  const turkishWords =
    /\b(merhaba|selam|nasıl|nasil|hakkında|hakkinda|istiyorum|nedir|bilgi|için|icin|lütfen|lutfen|teşekkür|tesekkur|evet|hayır|hayir|proje|hizmet|fiyat|teklif|ne kadar|kaça|kaca|zaman|süre|sure|yapar|olur|mı|mi|mu|mü)\b/i;
  return turkishChars.test(message) || turkishWords.test(message) ? 'tr' : 'en';
}

function resolveLang(raw: unknown, message: string): Lang {
  if (typeof raw === 'string') {
    const normalized = raw.trim().toLowerCase().slice(0, 2) as Lang;
    if (SUPPORTED_LANGS.includes(normalized)) return normalized;
  }
  return guessLang(message);
}

/**
 * Sent on every request — including Turkish. Previously no instruction was
 * added for Turkish at all, which let the model answer partly in English.
 */
const LANG_DIRECTIVE: Record<Lang, string> = {
  tr:
    '[SYSTEM: Kullanıcı Türkçe konuşuyor. Cevabının TAMAMINI Türkçe ver. ' +
    'Başlıklar, madde işaretleri, buton adları ve kapanış cümlesi dahil hiçbir ' +
    'bölümü İngilizce bırakma. Yerleşik teknik terimler (API, LLM, CRM gibi) ' +
    'olduğu gibi kalabilir, ama cümleler Türkçe olmalı.]',
  en:
    '[SYSTEM: The user is speaking English. Answer ENTIRELY in English. ' +
    'Do not leave any part — headings, bullet points, button names or the ' +
    'closing sentence — in Turkish.]',
};

const ERRORS: Record<Lang, Record<string, string>> = {
  tr: {
    badRequest: 'Geçersiz istek.',
    emptyMessage: 'Mesaj boş olamaz.',
    upstream: 'AI servisi şu an yanıt vermiyor.',
    noReply: 'Yanıt alınamadı.',
    unknown: 'Bilinmeyen hata.',
  },
  en: {
    badRequest: 'Invalid request.',
    emptyMessage: 'Message cannot be empty.',
    upstream: 'The AI service is not responding right now.',
    noReply: 'No response received.',
    unknown: 'Unknown error.',
  },
};

export const OPTIONS: APIRoute = ({ request }) => {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
};

export const POST: APIRoute = async ({ request }) => {
  const cors = corsHeaders(request);

  const fail = (message: string, status: number) =>
    new Response(JSON.stringify({ error: message }), { status, headers: cors });

  let body: {
    message: string;
    sessionId?: string;
    pageContext?: string;
    mode?: string;
    lang?: string;
  };
  try {
    body = await request.json();
  } catch {
    return fail(ERRORS[DEFAULT_LANG].badRequest, 400);
  }

  const {
    message,
    sessionId = 'default',
    pageContext = 'homepage',
    mode = 'website',
  } = body;

  const lang = resolveLang(body.lang, message ?? '');
  const errors = ERRORS[lang];

  if (!message?.trim()) {
    return fail(errors.emptyMessage, 400);
  }

  // Ensure session exists
  const existing = (await db
    .select()
    .from(ChatSessions)
    .where(eq(ChatSessions.sessionId, sessionId))) as any[];
  if (existing.length === 0) {
    await db.insert(ChatSessions).values({ sessionId, pageContext, mode });
  }

  // Save user message
  await db.insert(ChatMessages).values({
    sessionId,
    role: 'user',
    message: message.trim(),
    pageContext,
  });

  const prompt = `${LANG_DIRECTIVE[lang]} ${message.trim()}`;

  try {
    const n8nRes = await fetch(N8N_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatInput: prompt,
        message: prompt,
        sessionId: sessionId || 'default',
        pageContext,
        mode,
        language: lang,
      }),
    });

    if (!n8nRes.ok) {
      return fail(errors.upstream, 502);
    }

    const data = await n8nRes.json();

    const text =
      data?.output ??
      data?.text ??
      data?.message ??
      data?.response ??
      (Array.isArray(data) ? (data[0]?.output ?? data[0]?.text ?? data[0]?.message) : null) ??
      errors.noReply;

    const reply = String(text);

    // Save bot response
    await db.insert(ChatMessages).values({
      sessionId,
      role: 'bot',
      message: reply,
      pageContext,
    });

    return new Response(JSON.stringify({ text: reply, lang }), {
      status: 200,
      headers: cors,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : errors.unknown;
    return fail(msg, 500);
  }
};
