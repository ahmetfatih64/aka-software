export const prerender = false;
import type { APIRoute } from 'astro';
import { db, Proposals, ProposalItems } from 'astro:db';

async function nextProposalNumber(): Promise<string> {
  const all = await db.select().from(Proposals);
  const year = new Date().getFullYear();
  const seq  = (all.length + 1).toString().padStart(3, '0');
  return `TKL-${year}-${seq}`;
}

export const POST: APIRoute = async ({ request, redirect }) => {
  const data = await request.formData();

  const leadId      = Number(data.get('leadId'));
  const title       = (data.get('title') as string)?.trim();
  const validUntil  = data.get('validUntil') as string;
  const discountRate = parseFloat((data.get('discountRate') as string) || '0');

  if (!leadId || !title || !validUntil) return redirect('/admin/teklifler');

  const descs   = data.getAll('item_desc[]')  as string[];
  const units   = data.getAll('item_unit[]')  as string[];
  const qtys    = data.getAll('item_qty[]')   as string[];
  const prices  = data.getAll('item_price[]') as string[];

  // Hesaplamalar
  let subtotal = 0;
  const items = descs.map((desc, i) => {
    const qty   = parseFloat(qtys[i]   || '1');
    const price = parseFloat(prices[i] || '0');
    const total = qty * price;
    subtotal += total;
    return { desc, unit: units[i] || 'adet', qty, price, total };
  });

  const discountAmount = subtotal * (discountRate / 100);
  const taxBase        = subtotal - discountAmount;
  const taxAmount      = taxBase * 0.20;
  const totalAmount    = taxBase + taxAmount;

  const proposalNumber = await nextProposalNumber();

  const [proposal] = await db.insert(Proposals).values({
    leadId,
    proposalNumber,
    title,
    status:         'draft',
    currency:       'TRY',
    subtotal,
    discountRate,
    discountAmount,
    taxRate:        20,
    taxAmount,
    totalAmount,
    validUntil:     new Date(validUntil),
    notes:          (data.get('notes') as string)?.trim() || undefined,
    terms:          (data.get('terms') as string)?.trim() || undefined,
  }).returning();

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (!it.desc.trim()) continue;
    await db.insert(ProposalItems).values({
      proposalId:  proposal.id,
      sortOrder:   i,
      description: it.desc.trim(),
      unit:        it.unit,
      quantity:    it.qty,
      unitPrice:   it.price,
      totalPrice:  it.total,
    });
  }

  return redirect('/admin/teklifler?saved=1');
};
