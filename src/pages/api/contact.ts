import type { APIRoute } from 'astro';
import { db, ContactMessages } from 'astro:db';

// ── In-memory rate limiter ────────────────────────────────────────────────
// Allows 3 submissions per IP per 10 minutes.
// Resets on server restart — sufficient for a contact form.
const rl = new Map<string, { n: number; reset: number }>();
const RL_LIMIT  = 3;
const RL_WINDOW = 10 * 60 * 1000; // 10 minutes

function getIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}

function isRateLimited(ip: string): boolean {
  const now   = Date.now();
  const entry = rl.get(ip);
  if (!entry || now > entry.reset) {
    rl.set(ip, { n: 1, reset: now + RL_WINDOW });
    return false;
  }
  if (entry.n >= RL_LIMIT) return true;
  entry.n++;
  return false;
}
// ─────────────────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request }) => {
  // ── Rate limit check ──────────────────────────────────────────
  if (isRateLimited(getIp(request))) {
    return json(
      { error: 'Çok fazla istek gönderildi. Lütfen 10 dakika sonra tekrar deneyin.' },
      429
    );
  }

  let data: FormData;
  try {
    data = await request.formData();
  } catch {
    return json({ error: 'Geçersiz form verisi.' }, 400);
  }

  // ── Honeypot — filled = bot ───────────────────────────────────
  if (data.get('website')?.toString()) {
    // Return 200 silently so bots don't learn they were blocked
    return json({ success: true });
  }

  // ── Extract + sanitize ────────────────────────────────────────
  const name    = data.get('name')?.toString().trim()    ?? '';
  const email   = data.get('email')?.toString().trim()   ?? '';
  const message = data.get('message')?.toString().trim() ?? '';

  // ── Server-side validation (mirrors client rules) ─────────────
  if (!name || name.length < 2) {
    return json({ error: 'Ad soyad en az 2 karakter olmalıdır.', field: 'name' }, 400);
  }
  if (name.length > 100) {
    return json({ error: 'Ad soyad çok uzun.', field: 'name' }, 400);
  }
  if (!email || !EMAIL_RE.test(email)) {
    return json({ error: 'Geçerli bir e-posta adresi girin.', field: 'email' }, 400);
  }
  if (email.length > 254) {
    return json({ error: 'E-posta adresi çok uzun.', field: 'email' }, 400);
  }
  if (!message || message.length < 10) {
    return json({ error: 'Mesaj en az 10 karakter olmalıdır.', field: 'message' }, 400);
  }
  if (message.length > 2000) {
    return json({ error: 'Mesaj 2000 karakteri aşamaz.', field: 'message' }, 400);
  }

  // ── Persist ───────────────────────────────────────────────────
  try {
    await db.insert(ContactMessages).values({ name, email, message });
    return json({ success: true });
  } catch (err) {
    console.error('[contact] DB insert failed:', err);
    return json({ error: 'Sunucu hatası oluştu. Lütfen tekrar deneyin.' }, 500);
  }
};
