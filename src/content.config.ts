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

export const collections = { blog, labs, claatLabs };
