import type { APIRoute } from 'astro';
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  courseLessons,
  courseToMarkdown,
  labUrl,
  lessonToMarkdown,
  postUrl,
  publishedCourses,
  publishedLabs,
  publishedPosts,
  toMarkdown,
} from '../helpers/llm';

export const GET: APIRoute = async ({ site }) => {
  const posts = await publishedPosts();
  const labs = await publishedLabs();
  const courses = await publishedCourses();
  const courseSections = await Promise.all(
    courses.map(async (course) => [
      courseToMarkdown(course, site!),
      ...(await courseLessons(course.id)).map((lesson) => lessonToMarkdown(lesson, course, site!)),
    ]),
  );

  const sections = [
    ...posts.map((p) => toMarkdown(p, postUrl(p.id), site!)),
    ...labs.map((l) => toMarkdown(l, labUrl(l.id), site!)),
    ...courseSections.flat(),
  ];
  const body = `# ${SITE_NAME}\n\n> ${SITE_DESCRIPTION}\n\n---\n\n${sections.join('\n---\n\n')}`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
