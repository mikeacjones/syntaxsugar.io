import type { APIRoute } from 'astro';
import { SITE_DESCRIPTION, SITE_NAME, labUrl, postUrl, publishedLabs, publishedPosts, toMarkdown } from '../helpers/llm';

export const GET: APIRoute = async ({ site }) => {
  const posts = await publishedPosts();
  const labs = await publishedLabs();

  const sections = [
    ...posts.map((p) => toMarkdown(p, postUrl(p.id), site!)),
    ...labs.map((l) => toMarkdown(l, labUrl(l.id), site!)),
  ];
  const body = `# ${SITE_NAME}\n\n> ${SITE_DESCRIPTION}\n\n---\n\n${sections.join('\n---\n\n')}`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
