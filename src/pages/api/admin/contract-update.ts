import type { APIRoute } from 'astro';
import { db, Contracts, eq } from 'astro:db';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data = await request.formData();
  const id   = Number(data.get('id'));
  if (!id) return redirect('/admin/sozlesmeler');

  const startRaw  = data.get('startDate')  as string;
  const endRaw    = data.get('endDate')    as string;
  const signedRaw = data.get('signedAt')   as string;
  const hrRaw     = data.get('hourlyRate') as string;

  await db.update(Contracts).set({
    title:        (data.get('title')        as string)?.trim(),
    status:       (data.get('status')       as string) || 'draft',
    contractType: (data.get('contractType') as string) || 'fixed_price',
    paymentTerms: Number(data.get('paymentTerms') || 30),
    hourlyRate:   hrRaw ? Number(hrRaw) : undefined,
    startDate:    startRaw  ? new Date(startRaw)  : undefined,
    endDate:      endRaw    ? new Date(endRaw)    : undefined,
    signedAt:     signedRaw ? new Date(signedRaw) : undefined,
    signedBy:     (data.get('signedBy') as string)?.trim() || undefined,
    notes:        (data.get('notes')    as string)?.trim() || undefined,
    updatedAt:    new Date(),
  }).where(eq(Contracts.id, id));

  return redirect('/admin/sozlesmeler?saved=1');
};
