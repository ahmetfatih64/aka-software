export const prerender = false;
import type { APIRoute } from 'astro';
import { db, Proposals, ProposalItems, eq } from 'astro:db';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data = await request.formData();
  const id   = Number(data.get('id'));
  if (!id) return redirect('/admin/teklifler');

  await db.delete(ProposalItems).where(eq(ProposalItems.proposalId, id));
  await db.delete(Proposals).where(eq(Proposals.id, id));

  return redirect('/admin/teklifler');
};
