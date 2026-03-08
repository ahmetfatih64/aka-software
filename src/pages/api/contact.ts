import type { APIRoute } from 'astro';
import { db, ContactMessages } from 'astro:db';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.formData();

    const name    = data.get('name')?.toString().trim()    ?? '';
    const email   = data.get('email')?.toString().trim()   ?? '';
    const message = data.get('message')?.toString().trim() ?? '';

    // Basic server-side validation
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: 'Tüm alanlar zorunludur.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Geçerli bir e-posta adresi girin.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await db.insert(ContactMessages).values({ name, email, message });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[contact] DB insert failed:', err);
    return new Response(
      JSON.stringify({ error: 'Sunucu hatası oluştu. Lütfen tekrar deneyin.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
