import { getCollection, type CollectionEntry } from 'astro:content';
import { postUrl } from './format';

export const SITE_NAME = 'syntax sugar';
export const AUTHOR = 'Michael Jones';
export const SITE_DESCRIPTION =
  'Michael Jones writes about durable execution, Temporal, distributed systems, and integration engineering.';

export function labUrl(id: string): string {
  return `/lab/${id.replace(/\/index$/, '')}/`;
}

// Markdown twin of a page, served next to it so agents can skip the HTML.
export function markdownUrl(pageUrl: string): string {
  return `${pageUrl}index.md`;
}

export async function publishedPosts() {
  const posts = await getCollection('blog', ({ data }) => data.published === true);
  return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export async function publishedLabs() {
  const labs = await getCollection('labs', ({ data }) => data.published === true);
  return labs.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function courseUrl(id: string): string {
  return `/course/${id}/`;
}

// Lesson ids are "<course>/<lesson>".
export function lessonUrl(id: string): string {
  return `/course/${id}/`;
}

export async function publishedCourses() {
  const courses = await getCollection('courses', ({ data }) => data.published === true);
  return courses.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export async function courseLessons(course: string) {
  const lessons = await getCollection('courseLessons', ({ data }) => data.course === course);
  return lessons.sort((a, b) => a.data.order - b.data.order);
}

export async function publishedClaatLabs() {
  const labs = await getCollection('claatLabs', ({ data }) => data.published === true);
  return labs.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

// Post bodies are plain Markdown (no MDX components), so the only thing to fix
// is images: Astro rewrites relative image paths to hashed assets, so a
// relative link in the .md file would 404. Keep the alt text instead.
function cleanBody(body: string): string {
  return body
    .replace(/!\[([^\]]*)\]\((?!https?:)[^)]+\)/g, (_, alt) => (alt ? `*[Image: ${alt}]*` : ''))
    // Course lessons wrap each language's build steps in a <div> for the tabs.
    .replace(/<div class="CourseLang"[^>]*data-label="([^"]*)">/g, '**$1:**')
    .replace(/^<\/div>$/gm, '');
}

type Entry = CollectionEntry<'blog'> | CollectionEntry<'labs'>;

export function toMarkdown(entry: Entry, url: string, site: URL): string {
  const { title, date, shortDescription } = entry.data;
  const tags = 'tags' in entry.data ? entry.data.tags : entry.data.categories;
  const header = [
    `# ${title}`,
    '',
    `> ${shortDescription}`,
    '',
    `- Author: ${AUTHOR}`,
    `- Published: ${date.toISOString().slice(0, 10)}`,
    `- Tags: ${tags.join(', ')}`,
    `- URL: ${new URL(url, site)}`,
  ];
  return `${header.join('\n')}\n\n${cleanBody(entry.body ?? '').trim()}\n`;
}

export function courseToMarkdown(course: CollectionEntry<'courses'>, site: URL): string {
  const { title, shortDescription, date, updated, categories, repo, languages } = course.data;
  const header = [
    `# ${title}`,
    '',
    `> ${shortDescription}`,
    '',
    `- Author: ${AUTHOR}`,
    `- Published: ${date.toISOString().slice(0, 10)}`,
    `- Updated: ${updated.toISOString().slice(0, 10)}`,
    `- Tags: ${categories.join(', ')}`,
    `- Languages: ${languages.map((l) => l.label).join(', ')}`,
    `- Source: https://github.com/${repo}`,
    `- URL: ${new URL(courseUrl(course.id), site)}`,
  ];
  return `${header.join('\n')}\n\n${cleanBody(course.body ?? '').trim()}\n`;
}

export function lessonToMarkdown(
  lesson: CollectionEntry<'courseLessons'>,
  course: CollectionEntry<'courses'>,
  site: URL,
): string {
  const { title, shortDescription, updated, section } = lesson.data;
  const header = [
    `# ${title}`,
    '',
    `> ${shortDescription}`,
    '',
    `- Course: [${course.data.title}](${new URL(markdownUrl(courseUrl(course.id)), site)})`,
    `- Section: ${section}`,
    `- Author: ${AUTHOR}`,
    `- Updated: ${updated.toISOString().slice(0, 10)}`,
    `- URL: ${new URL(lessonUrl(lesson.id), site)}`,
  ];
  return `${header.join('\n')}\n\n${cleanBody(lesson.body ?? '').trim()}\n`;
}

export { postUrl };
