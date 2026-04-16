export const prerender = false;
import type { APIRoute } from 'astro';
import { db, ContactMessages } from 'astro:db';
import { createTransport } from 'nodemailer';
import { corsHeaders } from '../../lib/cors';

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

export const OPTIONS: APIRoute = ({ request }) => {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
};

export const POST: APIRoute = async ({ request }) => {
  const cors = corsHeaders(request);

  function json(body: object, status = 200) {
    return new Response(JSON.stringify(body), { status, headers: cors });
  }
  // ── Rate limit check (temporarily disabled for testing) ───────
  // if (isRateLimited(getIp(request))) {
  //   return json(
  //     { error: 'Çok fazla istek gönderildi. Lütfen 10 dakika sonra tekrar deneyin.' },
  //     429
  //   );
  // }

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
  } catch (err) {
    console.error('[contact] DB insert failed:', err);
    return json({ error: 'Sunucu hatası oluştu. Lütfen tekrar deneyin.' }, 500);
  }

  // ── Send e-mail notification ─────────────────────────────────
  const smtpHost = import.meta.env.SMTP_HOST;
  const smtpUser = import.meta.env.SMTP_USER;
  const smtpPass = import.meta.env.SMTP_PASS;
  const smtpTo   = import.meta.env.SMTP_TO || 'info@akasoftware.com.tr';

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const smtpPort = Number(import.meta.env.SMTP_PORT) || 587;
      const transporter = createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
        tls: { servername: smtpHost, rejectUnauthorized: false },
      });

      await transporter.sendMail({
        from: `"AKA Software Web" <${smtpUser}>`,
        replyTo: email,
        to: smtpTo,
        subject: `Yeni Teklif Talebi: ${name}`,
        text: `Ad Soyad: ${name}\nE-posta: ${email}\n\nMesaj:\n${message}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;">
            <h2 style="color:#b8860b;border-bottom:2px solid #b8860b;padding-bottom:8px;">Yeni Teklif Talebi</h2>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:8px 0;font-weight:bold;width:120px;">Ad Soyad</td><td>${name}</td></tr>
              <tr><td style="padding:8px 0;font-weight:bold;">E-posta</td><td><a href="mailto:${email}">${email}</a></td></tr>
            </table>
            <h3 style="margin-top:20px;">Mesaj</h3>
            <p style="background:#f5f5f5;padding:16px;border-radius:8px;white-space:pre-wrap;">${message}</p>
            <hr style="margin-top:24px;border:none;border-top:1px solid #ddd;">
            <p style="font-size:12px;color:#999;">Bu e-posta akasoftware.com.tr iletişim formundan otomatik gönderilmiştir.</p>
          </div>
        `,
      });
      console.log('[contact] Email sent to', smtpTo);
    } catch (mailErr) {
      // DB kaydı başarılı — mail hatası kullanıcıyı engellemesin
      console.error('[contact] Email send failed:', mailErr);
    }
  }

  return json({ success: true });
};
