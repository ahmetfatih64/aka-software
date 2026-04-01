import type { APIRoute } from 'astro';
import { db, SiteSettings, eq } from 'astro:db';

export const POST: APIRoute = async ({ request, redirect }) => {
  const data  = await request.formData();
  const group = data.get('group') as string;

  // Get all settings for this group
  const existing = await db.select().from(SiteSettings).where(eq(SiteSettings.group, group));

  for (const row of existing) {
    const newVal = data.get(row.key) as string | null;
    if (newVal !== null) {
      await db.update(SiteSettings).set({ value: newVal.trim() }).where(eq(SiteSettings.key, row.key));
    }
  }

  return redirect('/admin/ayarlar?saved=1');
};
