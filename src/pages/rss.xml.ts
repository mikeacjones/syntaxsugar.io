import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { SITE_DESCRIPTION, SITE_NAME, postUrl, publishedPosts } from '../helpers/llm';

export const GET: APIRoute = async ({ site }) => {
  const posts = await publishedPosts();
  return rss({
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    site: site!,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.shortDescription,
      categories: post.data.tags,
      link: postUrl(post.id),
    })),
  });
};
