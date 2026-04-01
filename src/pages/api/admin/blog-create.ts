import type { APIRoute } from 'astro';
import { writePost, toSlug, listPosts } from '../../../lib/blogFs';
import type { BlogFm } from '../../../lib/blogFs';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data = await request.formData();

  const title       = (data.get('title')       as string)?.trim();
  const description = (data.get('description') as string)?.trim();
  const tagsRaw     = (data.get('tags')         as string)?.trim() ?? '';
  const content     = (data.get('content')      as string) ?? '';
  const publishDate = (data.get('publishDate')  as string)?.trim();
  const draft       = data.get('draft') === 'true';

  if (!title || !description) return redirect('/admin/blog/yeni');

  // Generate unique slug
  let slug = toSlug(title);
  const existing = new Set(listPosts().map(p => p.slug));
  let counter = 2;
  let candidate = slug;
  while (existing.has(candidate)) { candidate = `${slug}-${counter++}`; }
  slug = candidate;

  const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];
  const date = publishDate ? new Date(publishDate).toISOString() : new Date().toISOString();

  const fm: BlogFm = { title, description, publishDate: date, tags, draft };
  writePost(slug, fm, content);

  return redirect('/admin/blog?saved=1');
};
