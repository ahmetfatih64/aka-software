export const prerender = false;
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ cookies, redirect }) => {
  cookies.delete('aka_admin', { path: '/' });
  return redirect('/admin/login');
};
