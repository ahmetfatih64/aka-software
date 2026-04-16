export const prerender = false;
import type { APIRoute } from 'astro';
import { db, Leads } from 'astro:db';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data = await request.formData();

  const contactName  = (data.get('contactName')  as string)?.trim();
  const contactEmail = (data.get('contactEmail') as string)?.trim();
  if (!contactName || !contactEmail) return redirect('/admin/leads');

  const estimatedRaw = data.get('estimatedValue') as string;
  const followUpRaw  = data.get('nextFollowUp')   as string;

  await db.insert(Leads).values({
    contactName,
    contactEmail,
    companyName:    (data.get('companyName')  as string)?.trim() || undefined,
    contactPhone:   (data.get('contactPhone') as string)?.trim() || undefined,
    source:         (data.get('source')       as string) || 'web_form',
    priority:       (data.get('priority')     as string) || 'medium',
    status:         'new',
    estimatedValue: estimatedRaw ? Number(estimatedRaw) : undefined,
    nextFollowUp:   followUpRaw  ? new Date(followUpRaw) : undefined,
    notes:          (data.get('notes')        as string)?.trim() || undefined,
  });

  return redirect('/admin/leads?saved=1');
};
