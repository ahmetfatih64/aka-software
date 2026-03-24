import type { APIRoute } from 'astro';
import { db, ContactMessages, eq } from 'astro:db';

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const id   = parseInt(form.get('id')?.toString() ?? '', 10);
  const back = form.get('back')?.toString() ?? '/admin/mesajlar';
  if (!isNaN(id)) {
    await db.update(ContactMessages).set({ isRead: true }).where(eq(ContactMessages.id, id));
  }
  return redirect(back);
};
