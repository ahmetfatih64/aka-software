import type { APIRoute } from 'astro';
import { db, Projects, Contracts, eq } from 'astro:db';

async function nextProjectCode(): Promise<string> {
  const all  = await db.select().from(Projects);
  const year = new Date().getFullYear();
  const seq  = (all.length + 1).toString().padStart(3, '0');
  return `PRJ-${year}-${seq}`;
}

export const POST: APIRoute = async ({ request, redirect }) => {
  const data       = await request.formData();
  const contractId = Number(data.get('contractId'));
  const leadId     = Number(data.get('leadId'));
  const name       = (data.get('name') as string)?.trim();

  if (!name) return redirect('/admin/sozlesmeler');

  const budgetRaw  = data.get('budgetAmount') as string;
  const hoursRaw   = data.get('budgetHours')  as string;
  const hrRaw      = data.get('hourlyRate')   as string;
  const startRaw   = data.get('startDate')    as string;
  const endRaw     = data.get('endDate')      as string;

  const projectCode = await nextProjectCode();

  await db.insert(Projects).values({
    contractId:   contractId || undefined,
    leadId:       leadId     || undefined,
    projectCode,
    name,
    status:       'planning',
    projectType:  (data.get('projectType') as string) || 'fixed_price',
    budgetAmount: budgetRaw ? Number(budgetRaw) : undefined,
    budgetHours:  hoursRaw  ? Number(hoursRaw)  : undefined,
    hourlyRate:   hrRaw     ? Number(hrRaw)     : undefined,
    startDate:    startRaw  ? new Date(startRaw)  : undefined,
    endDate:      endRaw    ? new Date(endRaw)    : undefined,
    description:  (data.get('description') as string)?.trim() || undefined,
  });

  // Sözleşmeyi active'e al
  if (contractId) {
    await db.update(Contracts)
      .set({ status: 'active', updatedAt: new Date() })
      .where(eq(Contracts.id, contractId));
  }

  return redirect('/admin/projeler?saved=1');
};
