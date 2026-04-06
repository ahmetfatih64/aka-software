import type { APIRoute } from 'astro';
import { db, TimeEntries, eq } from 'astro:db';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data   = await request.formData();
  const id     = Number(data.get('id'));
  const status = data.get('status') as string;
  if (!id || !status) return redirect('/admin/zaman-takibi');

  const valid = ['submitted', 'approved', 'rejected'];
  if (!valid.includes(status)) return redirect('/admin/zaman-takibi');

  const [entry] = await db.select().from(TimeEntries).where(eq(TimeEntries.id, id));
  if (!entry || entry.status === 'invoiced') return redirect('/admin/zaman-takibi');

  const updates: Record<string, unknown> = { status };
  if (status === 'approved') {
    updates.approvedBy = import.meta.env.ADMIN_USER ?? 'admin';
    updates.approvedAt = new Date();
  }

  await db.update(TimeEntries).set(updates).where(eq(TimeEntries.id, id));

  return redirect('/admin/zaman-takibi?saved=1');
};
