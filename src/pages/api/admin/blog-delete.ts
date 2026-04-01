import type { APIRoute } from 'astro';
import { deletePost } from '../../../lib/blogFs';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data = await request.formData();
  const slug = (data.get('slug') as string)?.trim();

  if (slug) deletePost(slug);

  return redirect('/admin/blog?deleted=1');
};
