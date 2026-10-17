import type { APIRoute } from 'astro';
import {
  AUTHOR,
  SITE_DESCRIPTION,
  SITE_NAME,
  labUrl,
  markdownUrl,
  postUrl,
  publishedClaatLabs,
  publishedLabs,
  publishedPosts,
} from '../helpers/llm';

// https://llmstxt.org: a Markdown index that points agents at clean copies of the content.
export const GET: APIRoute = async ({ site }) => {
  const abs = (path: string) => new URL(path, site).toString();
  const posts = await publishedPosts();
  const labs = await publishedLabs();
  const claatLabs = await publishedClaatLabs();

  const lines = [
    `# ${SITE_NAME}`,
    '',
    `> ${SITE_DESCRIPTION}`,
    '',
    `A personal blog by ${AUTHOR}. Recent posts cover Temporal, durable execution, and Temporal Cloud; older posts cover MuleSoft and DataWeave. Every post and Markdown lab below links to a plain Markdown copy. The full text of every post is in [llms-full.txt](${abs('/llms-full.txt')}).`,
    '',
    '## Posts',
    '',
    ...posts.map(
      (p) => `- [${p.data.title}](${abs(markdownUrl(postUrl(p.id)))}): ${p.data.shortDescription}`,
    ),
    '',
    '## Labs',
    '',
    ...labs.map((l) => `- [${l.data.title}](${abs(markdownUrl(labUrl(l.id)))}): ${l.data.shortDescription}`),
    ...claatLabs.map((l) => `- [${l.data.title}](${abs(l.data.url)}): ${l.data.shortDescription}`),
    '',
    '## Optional',
    '',
    `- [RSS feed](${abs('/rss.xml')})`,
    `- [Sitemap](${abs('/sitemap-index.xml')})`,
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
