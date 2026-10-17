import type { APIRoute, GetStaticPaths } from 'astro';
import type { CollectionEntry } from 'astro:content';
import { courseLessons, lessonToMarkdown, publishedCourses } from '../../../../helpers/llm';

export const getStaticPaths: GetStaticPaths = async () => {
  const courses = await publishedCourses();
  const paths = await Promise.all(
    courses.map(async (course) =>
      (await courseLessons(course.id)).map((lesson) => ({
        params: { course: course.id, lesson: lesson.id.split('/').pop() },
        props: { course, lesson },
      })),
    ),
  );
  return paths.flat();
};

export const GET: APIRoute = ({ props, site }) => {
  const course = props.course as CollectionEntry<'courses'>;
  const lesson = props.lesson as CollectionEntry<'courseLessons'>;
  return new Response(lessonToMarkdown(lesson, course, site!), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
