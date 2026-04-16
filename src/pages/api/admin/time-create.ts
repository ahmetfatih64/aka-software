export const prerender = false;
import type { APIRoute } from 'astro';
import { db, TimeEntries, Projects, eq } from 'astro:db';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data      = await request.formData();
  const projectId = Number(data.get('projectId'));
  const dateRaw   = data.get('entryDate') as string;
  const hoursRaw  = data.get('hours')     as string;
  const desc      = (data.get('description') as string)?.trim();

  if (!projectId || !dateRaw || !hoursRaw || !desc) {
    return redirect('/admin/zaman-takibi');
  }

  const hours      = parseFloat(hoursRaw);
  const isBillable = (data.get('isBillable') as string) === '1' ? 1 : 0;
  const hrRaw      = data.get('hourlyRate') as string;
  const hourlyRate = hrRaw ? parseFloat(hrRaw) : undefined;

  // Projenin saatlik ücretini kullan, form değeri yoksa
  let effectiveRate = hourlyRate;
  if (!effectiveRate) {
    const [proj] = await db.select().from(Projects).where(eq(Projects.id, projectId));
    effectiveRate = proj?.hourlyRate ?? undefined;
  }

  const billableAmount = isBillable && effectiveRate ? hours * effectiveRate : undefined;

  await db.insert(TimeEntries).values({
    projectId,
    userName:      import.meta.env.ADMIN_USER ?? 'admin',
    entryDate:     new Date(dateRaw),
    hours,
    description:   desc,
    isBillable,
    status:        'draft',
    hourlyRate:    effectiveRate,
    billableAmount,
  });

  return redirect('/admin/zaman-takibi?saved=1');
};
