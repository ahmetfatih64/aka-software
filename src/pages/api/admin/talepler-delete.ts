import type { APIRoute } from 'astro';
import { db, ServiceRequests, eq } from 'astro:db';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data = await request.formData();
  const id   = Number(data.get('id'));
  const back = (data.get('back') as string) || '/admin/talepler';

  if (id) {
    await db.delete(ServiceRequests).where(eq(ServiceRequests.id, id));
  }

  return redirect(back);
};
