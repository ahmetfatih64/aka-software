export const prerender = false;
import type { APIRoute } from 'astro';
import { db, ServiceRequests } from 'astro:db';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data = await request.formData();
  const back = (data.get('back') as string) || '/admin/talepler';

  const name    = (data.get('name')    as string)?.trim();
  const email   = (data.get('email')   as string)?.trim();
  const company = (data.get('company') as string)?.trim() || null;
  const phone   = (data.get('phone')   as string)?.trim() || null;
  const service = (data.get('service') as string) || 'other';
  const message = (data.get('message') as string)?.trim();
  const status  = (data.get('status')  as string) || 'beklemede';

  if (!name || !email || !message) {
    return redirect(back);
  }

  await db.insert(ServiceRequests).values({ name, email, company, phone, service, message, status });

  return redirect(back);
};
