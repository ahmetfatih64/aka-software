export const prerender = false;
import type { APIRoute } from 'astro';
import { db, TimeEntries, eq } from 'astro:db';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data = await request.formData();
  const id   = Number(data.get('id'));
  if (!id) return redirect('/admin/zaman-takibi');

  const [entry] = await db.select().from(TimeEntries).where(eq(TimeEntries.id, id));
  if (!entry || entry.status === 'invoiced') return redirect('/admin/zaman-takibi');

  const hours      = parseFloat(data.get('hours') as string || '0');
  const isBillable = (data.get('isBillable') as string) === '1' ? 1 : 0;
  const billableAmount = isBillable && entry.hourlyRate ? hours * entry.hourlyRate : undefined;

  await db.update(TimeEntries).set({
    hours,
    description:   (data.get('description') as string)?.trim(),
    entryDate:     new Date(data.get('entryDate') as string),
    isBillable,
    billableAmount,
    status:        'draft', // düzenleme taslağa geri alır
  }).where(eq(TimeEntries.id, id));

  return redirect('/admin/zaman-takibi?saved=1');
};
