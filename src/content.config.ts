import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

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

export const collections = { blog };
