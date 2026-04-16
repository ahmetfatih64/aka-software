export const prerender = false;
import type { APIRoute } from 'astro';
import { getPost, writePost } from '../../../lib/blogFs';
import type { BlogFm } from '../../../lib/blogFs';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data = await request.formData();

  const slug        = (data.get('slug')        as string)?.trim();
  const title       = (data.get('title')       as string)?.trim();
  const description = (data.get('description') as string)?.trim();
  const tagsRaw     = (data.get('tags')         as string)?.trim() ?? '';
  const content     = (data.get('content')      as string) ?? '';
  const publishDate = (data.get('publishDate')  as string)?.trim();
  const draft       = data.get('draft') === 'true';

  if (!slug || !title || !description) return redirect('/admin/blog');

  const existing = getPost(slug);
  if (!existing) return redirect('/admin/blog');

  const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];
  const date = publishDate ? new Date(publishDate).toISOString() : existing.fm.publishDate;
  const updatedDate = new Date().toISOString();

  const fm: BlogFm = {
    title, description,
    publishDate: date,
    updatedDate,
    tags, draft,
  };

  writePost(slug, fm, content);

  return redirect('/admin/blog?saved=1');
};
