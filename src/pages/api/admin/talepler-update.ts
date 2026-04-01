import type { APIRoute } from 'astro';
import { db, ServiceRequests, eq } from 'astro:db';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data   = await request.formData();
  const id     = Number(data.get('id'));
  const status = (data.get('status') as string) || 'beklemede';
  const back   = (data.get('back')   as string) || '/admin/talepler';

  const valid = ['beklemede', 'inceleniyor', 'tamamlandi', 'reddedildi'];
  if (!id || !valid.includes(status)) return redirect(back);

  await db.update(ServiceRequests).set({ status }).where(eq(ServiceRequests.id, id));

  return redirect(back);
};
