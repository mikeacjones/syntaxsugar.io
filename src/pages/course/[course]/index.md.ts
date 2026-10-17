import type { APIRoute, GetStaticPaths } from 'astro';
import type { CollectionEntry } from 'astro:content';
import { courseToMarkdown, publishedCourses } from '../../../helpers/llm';

export const getStaticPaths: GetStaticPaths = async () => {
  const courses = await publishedCourses();
  return courses.map((course) => ({ params: { course: course.id }, props: { course } }));
};

export const GET: APIRoute = ({ props, site }) => {
  const course = props.course as CollectionEntry<'courses'>;
  return new Response(courseToMarkdown(course, site!), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
