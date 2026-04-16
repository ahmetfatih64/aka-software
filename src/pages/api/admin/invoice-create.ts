export const prerender = false;
import type { APIRoute } from 'astro';
import { db, Invoices } from 'astro:db';

async function nextInvoiceNumber(): Promise<string> {
  const all  = await db.select().from(Invoices);
  const year = new Date().getFullYear();
  const seq  = (all.length + 1).toString().padStart(3, '0');
  return `FTR-${year}-${seq}`;
}

export const POST: APIRoute = async ({ request, redirect }) => {
  const data      = await request.formData();
  const projectId = Number(data.get('projectId'));
  const issueRaw  = data.get('issueDate') as string;
  const dueRaw    = data.get('dueDate')   as string;
  const subRaw    = data.get('subtotal')  as string;

  if (!projectId || !issueRaw || !dueRaw || !subRaw) return redirect('/admin/faturalar');

  const subtotal  = parseFloat(subRaw);
  const taxRate   = parseFloat((data.get('taxRate') as string) || '20');
  const taxAmount = subtotal * (taxRate / 100);
  const total     = subtotal + taxAmount;
  const leadId    = Number(data.get('leadId') || 0);

  const invoiceNumber = await nextInvoiceNumber();

  await db.insert(Invoices).values({
    projectId,
    leadId:       leadId || 0,
    invoiceNumber,
    status:       'draft',
    invoiceType:  (data.get('invoiceType') as string) || 'time_material',
    issueDate:    new Date(issueRaw),
    dueDate:      new Date(dueRaw),
    subtotal,
    taxRate,
    taxAmount,
    totalAmount:  total,
    paidAmount:   0,
    remaining:    total,
    notes:        (data.get('notes') as string)?.trim() || undefined,
  });

  return redirect('/admin/faturalar?saved=1');
};
