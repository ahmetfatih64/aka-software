import type { APIRoute } from 'astro';
import { db, Invoices, eq } from 'astro:db';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data   = await request.formData();
  const id     = Number(data.get('id'));
  const status = data.get('status') as string;
  if (!id || !status) return redirect('/admin/faturalar');

  const valid = ['sent', 'cancelled'];
  if (!valid.includes(status)) return redirect('/admin/faturalar');

  await db.update(Invoices).set({ status, updatedAt: new Date() }).where(eq(Invoices.id, id));
  return redirect('/admin/faturalar?saved=1');
};
