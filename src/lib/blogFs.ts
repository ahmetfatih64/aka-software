import { join } from 'node:path';
import { readdirSync, readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';

export const BLOG_DIR = join(process.cwd(), 'src', 'content', 'blog');

export interface BlogFm {
  title: string;
  description: string;
  publishDate: string;
  updatedDate?: string;
  tags: string[];
  draft: boolean;
}

export interface BlogPost {
  slug: string;
  fm: BlogFm;
  body: string;
}

/** Parse a .md file into frontmatter + body */
export function parseMd(raw: string): { fm: BlogFm; body: string } {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { fm: { title: '', description: '', publishDate: '', tags: [], draft: false }, body: raw };

  const yaml = m[1];
  const body = m[2] ?? '';
  const rec: Record<string, unknown> = {};

  for (const line of yaml.split('\n')) {
    const kv = line.match(/^([a-zA-Z_]+):\s*(.+)$/);
    if (!kv) continue;
    const [, key, raw] = kv;
    const v = raw.trim();
    if (v.startsWith('[')) {
      rec[key] = v.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    } else if (v === 'true')  rec[key] = true;
    else if (v === 'false')   rec[key] = false;
    else rec[key] = v.replace(/^["']|["']$/g, '');
  }

  return {
    fm: {
      title:       String(rec['title']       ?? ''),
      description: String(rec['description'] ?? ''),
      publishDate: String(rec['publishDate'] ?? new Date().toISOString()),
      updatedDate: rec['updatedDate'] ? String(rec['updatedDate']) : undefined,
      tags:        Array.isArray(rec['tags']) ? (rec['tags'] as string[]) : [],
      draft:       rec['draft'] === true,
    },
    body,
  };
}

/** Serialize frontmatter object + body back to a .md string */
export function serializeMd(fm: BlogFm, body: string): string {
  const lines: string[] = [
    `title: "${fm.title.replace(/"/g, '\\"')}"`,
    `description: "${fm.description.replace(/"/g, '\\"')}"`,
    `publishDate: "${fm.publishDate}"`,
  ];
  if (fm.updatedDate) lines.push(`updatedDate: "${fm.updatedDate}"`);
  lines.push(`tags: [${fm.tags.map(t => `"${t}"`).join(', ')}]`);
  lines.push(`draft: ${fm.draft}`);
  return `---\n${lines.join('\n')}\n---\n${body}`;
}

/** List all blog posts sorted by publishDate desc */
export function listPosts(): BlogPost[] {
  if (!existsSync(BLOG_DIR)) return [];
  const files = readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
  return files
    .map(f => {
      const slug = f.replace(/\.md$/, '');
      const raw = readFileSync(join(BLOG_DIR, f), 'utf-8');
      const { fm, body } = parseMd(raw);
      return { slug, fm, body };
    })
    .sort((a, b) => new Date(b.fm.publishDate).valueOf() - new Date(a.fm.publishDate).valueOf());
}

/** Read a single post by slug */
export function getPost(slug: string): BlogPost | null {
  const path = join(BLOG_DIR, `${slug}.md`);
  if (!existsSync(path)) return null;
  const raw = readFileSync(path, 'utf-8');
  const { fm, body } = parseMd(raw);
  return { slug, fm, body };
}

/** Write (create or overwrite) a post */
export function writePost(slug: string, fm: BlogFm, body: string): void {
  writeFileSync(join(BLOG_DIR, `${slug}.md`), serializeMd(fm, body), 'utf-8');
}

/** Delete a post */
export function deletePost(slug: string): void {
  const path = join(BLOG_DIR, `${slug}.md`);
  if (existsSync(path)) unlinkSync(path);
}

/** Generate a URL-safe Turkish slug from a title */
export function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
