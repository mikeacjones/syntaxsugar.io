import type { Loader } from 'astro/loaders';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export interface ClaatMeta {
  id: string;
  title: string;
  authors: string;
  summary: string;
  source: string;
  updated: string;
  duration: number;
  category: string[];
  tags: string[];
  status: string[];
  url: string;
}

export function claatLoader(base: string): Loader {
  return {
    name: 'claat-loader',
    async load({ store, logger }) {
      if (!existsSync(base)) {
        logger.info('No claat lab-content directory found, skipping.');
        return;
      }

      const dirs = readdirSync(base, { withFileTypes: true }).filter((d) =>
        d.isDirectory()
      );

      for (const dir of dirs) {
        const jsonPath = join(base, dir.name, 'codelab.json');
        if (!existsSync(jsonPath)) continue;

        const meta: ClaatMeta = JSON.parse(readFileSync(jsonPath, 'utf-8'));

        store.set({
          id: meta.id,
          data: {
            title: meta.title,
            date: new Date(meta.updated),
            shortDescription: meta.summary,
            categories: meta.category || [],
            published: meta.status?.includes('published') ?? true,
            duration: meta.duration > 0 ? `${meta.duration} min` : undefined,
            authors: meta.authors,
            url: `/lab-content/${meta.url}/`,
            claat: true,
          },
        });
      }

      logger.info(`Loaded ${dirs.length} claat lab(s).`);
    },
  };
}
