import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { claatLoader } from './loaders/claat';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    shortDescription: z.string(),
    tags: z.array(z.string()),
    published: z.boolean(),
  }),
});

const labs = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './labs' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    shortDescription: z.string(),
    categories: z.array(z.string()),
    published: z.boolean(),
    duration: z.string().optional(),
  }),
});

const claatLabs = defineCollection({
  loader: claatLoader('./public/lab-content'),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    shortDescription: z.string(),
    categories: z.array(z.string()),
    published: z.boolean(),
    duration: z.string().optional(),
    authors: z.string().optional(),
    url: z.string(),
    claat: z.literal(true),
  }),
});

// Courses are pulled from GitHub into .courses/ by scripts/sync-courses.mjs.
const courses = defineCollection({
  loader: glob({
    pattern: '*/index.md',
    base: './.courses',
    generateId: ({ entry }) => entry.replace(/\/index\.md$/, ''),
  }),
  schema: z.object({
    title: z.string(),
    shortTitle: z.string(),
    shortDescription: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date(),
    categories: z.array(z.string()),
    published: z.boolean(),
    duration: z.string().optional(),
    repo: z.string(),
    defaultBranch: z.string(),
    languages: z.array(z.object({ branch: z.string(), label: z.string(), codespace: z.string() })),
    pages: z.array(z.object({ slug: z.string(), title: z.string(), section: z.string() })),
  }),
});

const courseLessons = defineCollection({
  loader: glob({
    pattern: '*/*/index.md',
    base: './.courses',
    generateId: ({ entry }) => entry.replace(/\/index\.md$/, ''),
  }),
  schema: z.object({
    course: z.string(),
    title: z.string(),
    navTitle: z.string(),
    section: z.string(),
    order: z.number(),
    shortDescription: z.string(),
    updated: z.coerce.date(),
    source: z.string(),
  }),
});

export const collections = { blog, labs, claatLabs, courses, courseLessons };
