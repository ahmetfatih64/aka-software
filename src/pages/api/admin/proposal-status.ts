export const prerender = false;
import type { APIRoute } from 'astro';
import { db, Proposals, Contracts, eq } from 'astro:db';

async function nextContractNumber(): Promise<string> {
  const all  = await db.select().from(Contracts);
  const year = new Date().getFullYear();
  const seq  = (all.length + 1).toString().padStart(3, '0');
  return `SZL-${year}-${seq}`;
}

export const POST: APIRoute = async ({ request, redirect }) => {
  const data   = await request.formData();
  const id     = Number(data.get('id'));
  const status = data.get('status') as string;
  if (!id || !status) return redirect('/admin/teklifler');

  const valid = ['draft', 'sent', 'accepted', 'rejected', 'expired'];
  if (!valid.includes(status)) return redirect('/admin/teklifler');

  const updates: Record<string, unknown> = { status, updatedAt: new Date() };
  if (status === 'sent')     updates.sentAt     = new Date();
  if (status === 'accepted') updates.acceptedAt = new Date();

  await db.update(Proposals).set(updates).where(eq(Proposals.id, id));

  // Kabul edilince sözleşme taslağı oluştur
  if (status === 'accepted') {
    const [proposal] = await db.select().from(Proposals).where(eq(Proposals.id, id));
    if (proposal) {
      const existing = await db.select().from(Contracts)
        .where(eq(Contracts.proposalId, id));

      if (existing.length === 0) {
        const contractNumber = await nextContractNumber();
        await db.insert(Contracts).values({
          proposalId:    id,
          leadId:        proposal.leadId,
          contractNumber,
          title:         proposal.title,
          status:        'draft',
          contractType:  'fixed_price',
          totalValue:    proposal.totalAmount,
          billingCycle:  'milestone',
          paymentTerms:  30,
          notes:         proposal.terms || undefined,
        });
      }
    }
  }

  return redirect('/admin/teklifler?saved=1');
};
