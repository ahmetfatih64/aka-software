import { defineCollection, z } from 'astro:content';

const pagesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    slug: z.string().optional(),
    navOrder: z.number().optional(),
    updatedDate: z.coerce.date().optional(),
    sections: z.any().optional(), // For home.md
  }),
});

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().optional().default(false),
  }),
});

const caseStudiesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.coerce.date(),
    industry: z.string(),
    services: z.array(z.string()).default([]),
    tech: z.array(z.string()).default([]),
    highlights: z.array(z.string()).default([]),
    draft: z.boolean().optional().default(false),
  }),
});

const legalCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    updatedDate: z.coerce.date(),
  }),
});

export const collections = {
  'pages': pagesCollection,
  'blog': blogCollection,
  'case-studies': caseStudiesCollection,
  'legal': legalCollection,
};
