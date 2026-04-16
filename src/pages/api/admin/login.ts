export const prerender = false;
import type { APIRoute } from 'astro';
import { createHmac } from 'node:crypto';

function createToken(secret: string): string {
  const ts  = Date.now().toString();
  const sig = createHmac('sha256', secret).update(ts).digest('hex');
  return Buffer.from(`${ts}:${sig}`).toString('base64');
}

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const form     = await request.formData();
  const username = form.get('username')?.toString().trim() ?? '';
  const password = form.get('password')?.toString() ?? '';

  const adminUser = import.meta.env.ADMIN_USER;
  const adminPass = import.meta.env.ADMIN_PASS;
  const secret    = import.meta.env.ADMIN_SECRET;

  if (!adminUser || !adminPass || !secret) return redirect('/admin/login?error=config');
  if (username !== adminUser || password !== adminPass) return redirect('/admin/login?error=1');

  cookies.set('aka_admin', createToken(secret), {
    httpOnly: true,
    secure  : import.meta.env.PROD,
    sameSite: 'strict',
    maxAge  : 60 * 60 * 24,
    path    : '/',
  });

  return redirect('/admin/dashboard');
};
