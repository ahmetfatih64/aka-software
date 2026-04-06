import type { APIRoute } from 'astro';
import { db, Projects, eq } from 'astro:db';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data = await request.formData();
  const id   = Number(data.get('id'));
  if (!id) return redirect('/admin/projeler');

  const budgetRaw = data.get('budgetAmount') as string;
  const hrRaw     = data.get('hourlyRate')   as string;
  const startRaw  = data.get('startDate')    as string;
  const endRaw    = data.get('endDate')      as string;

  await db.update(Projects).set({
    name:         (data.get('name')        as string)?.trim(),
    status:       (data.get('status')      as string) || 'planning',
    projectType:  (data.get('projectType') as string) || 'fixed_price',
    budgetAmount: budgetRaw ? Number(budgetRaw) : undefined,
    hourlyRate:   hrRaw     ? Number(hrRaw)     : undefined,
    startDate:    startRaw  ? new Date(startRaw) : undefined,
    endDate:      endRaw    ? new Date(endRaw)   : undefined,
    description:  (data.get('description') as string)?.trim() || undefined,
    updatedAt:    new Date(),
  }).where(eq(Projects.id, id));

  return redirect('/admin/projeler?saved=1');
};
