import type { APIRoute } from 'astro';
import { db, Leads, eq } from 'astro:db';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data = await request.formData();
  const id   = Number(data.get('id'));
  const back = (data.get('back') as string) || '/admin/leads';
  if (!id) return redirect(back);

  const estimatedRaw = data.get('estimatedValue') as string;
  const followUpRaw  = data.get('nextFollowUp')   as string;

  await db.update(Leads).set({
    contactName:    (data.get('contactName')  as string)?.trim(),
    contactEmail:   (data.get('contactEmail') as string)?.trim(),
    companyName:    (data.get('companyName')  as string)?.trim() || undefined,
    contactPhone:   (data.get('contactPhone') as string)?.trim() || undefined,
    status:         (data.get('status')       as string) || 'new',
    priority:       (data.get('priority')     as string) || 'medium',
    estimatedValue: estimatedRaw ? Number(estimatedRaw) : undefined,
    nextFollowUp:   followUpRaw  ? new Date(followUpRaw) : undefined,
    notes:          (data.get('notes')        as string)?.trim() || undefined,
    updatedAt:      new Date(),
  }).where(eq(Leads.id, id));

  return redirect('/admin/leads?saved=1');
};
