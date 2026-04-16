export const prerender = false;
import type { APIRoute } from 'astro';
import { db, Payments, Invoices, eq } from 'astro:db';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data      = await request.formData();
  const invoiceId = Number(data.get('invoiceId'));
  const amountRaw = data.get('amount')      as string;
  const dateRaw   = data.get('paymentDate') as string;

  if (!invoiceId || !amountRaw || !dateRaw) return redirect('/admin/faturalar');

  const amount = parseFloat(amountRaw);

  await db.insert(Payments).values({
    invoiceId,
    amount,
    paymentDate:   new Date(dateRaw),
    paymentMethod: (data.get('paymentMethod') as string) || 'bank_transfer',
    reference:     (data.get('reference') as string)?.trim() || undefined,
    notes:         (data.get('notes')     as string)?.trim() || undefined,
  });

  // Faturanın paid_amount ve remaining alanlarını güncelle
  const allPayments = await db.select().from(Payments).where(eq(Payments.invoiceId, invoiceId));
  const [invoice]   = await db.select().from(Invoices).where(eq(Invoices.id, invoiceId));

  if (invoice) {
    const paidAmount = allPayments.reduce((s, p) => s + p.amount, 0);
    const remaining  = Math.max(0, invoice.totalAmount - paidAmount);
    let   status     = invoice.status;

    if (paidAmount >= invoice.totalAmount) {
      status = 'paid';
    } else if (paidAmount > 0) {
      status = 'partial';
    }

    await db.update(Invoices).set({ paidAmount, remaining, status, updatedAt: new Date() })
      .where(eq(Invoices.id, invoiceId));
  }

  return redirect('/admin/faturalar?saved=1');
};
