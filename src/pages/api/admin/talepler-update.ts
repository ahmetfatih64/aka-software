import type { APIRoute } from 'astro';
import { db, ServiceRequests, Leads, eq } from 'astro:db';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data   = await request.formData();
  const id     = Number(data.get('id'));
  const status = (data.get('status') as string) || 'beklemede';
  const back   = (data.get('back')   as string) || '/admin/talepler';

  const valid = ['beklemede', 'inceleniyor', 'tamamlandi', 'reddedildi'];
  if (!id || !valid.includes(status)) return redirect(back);

  await db.update(ServiceRequests).set({ status }).where(eq(ServiceRequests.id, id));

  // 'inceleniyor' yapılınca otomatik lead oluştur (eğer yoksa)
  if (status === 'inceleniyor') {
    const existing = await db.select().from(Leads)
      .where(eq(Leads.serviceRequestId, id));

    if (existing.length === 0) {
      const [req] = await db.select().from(ServiceRequests)
        .where(eq(ServiceRequests.id, id));

      if (req) {
        await db.insert(Leads).values({
          serviceRequestId: id,
          companyName:  req.company  ?? undefined,
          contactName:  req.name,
          contactEmail: req.email,
          contactPhone: req.phone    ?? undefined,
          source:       'web_form',
          status:       'new',
          priority:     'medium',
          notes:        `Talep: ${req.service} — ${req.message}`,
          assignedTo:   undefined,
        });
      }
    }
  }

  // 'reddedildi' yapılınca bağlı lead'i 'lost' yap
  if (status === 'reddedildi') {
    const existing = await db.select().from(Leads)
      .where(eq(Leads.serviceRequestId, id));
    if (existing.length > 0) {
      await db.update(Leads)
        .set({ status: 'lost' })
        .where(eq(Leads.serviceRequestId, id));
    }
  }

  return redirect(back);
};
