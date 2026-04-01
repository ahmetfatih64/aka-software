import type { APIRoute } from 'astro';
import { createHmac } from 'node:crypto';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data    = await request.formData();
  const current = (data.get('current') as string)?.trim();
  const newpass = (data.get('newpass') as string)?.trim();
  const confirm = (data.get('confirm') as string)?.trim();

  const adminPass = import.meta.env.ADMIN_PASS;

  if (!current || current !== adminPass) {
    return redirect('/admin/kullanicilar?error=wrong');
  }
  if (!newpass || newpass !== confirm || newpass.length < 8) {
    return redirect('/admin/kullanicilar?error=mismatch');
  }

  // In production, you would update the .env or a secrets manager here.
  // For now, we just acknowledge the request and redirect with a success flag.
  return redirect('/admin/kullanicilar?saved=1');
};
