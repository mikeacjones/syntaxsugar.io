import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  courseUrl,
  labUrl,
  postUrl,
  publishedClaatLabs,
  publishedCourses,
  publishedLabs,
  publishedPosts,
} from '../helpers/llm';

// Posts, labs, and courses in one feed, newest first.
export const GET: APIRoute = async ({ site }) => {
  const posts = await publishedPosts();
  const labs = await publishedLabs();
  const claatLabs = await publishedClaatLabs();
  const courses = await publishedCourses();

  const items = [
    ...posts.map((p) => ({ ...p.data, categories: p.data.tags, link: postUrl(p.id) })),
    ...labs.map((l) => ({ ...l.data, link: labUrl(l.id) })),
    ...claatLabs.map((l) => ({ ...l.data, link: l.data.url })),
    ...courses.map((c) => ({ ...c.data, link: courseUrl(c.id) })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return rss({
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    site: site!,
    items: items.map((item) => ({
      title: item.title,
      pubDate: item.date,
      description: item.shortDescription,
      categories: item.categories,
      link: item.link,
    })),
  });
};
