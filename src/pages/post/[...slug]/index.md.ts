import type { APIRoute, GetStaticPaths } from 'astro';
import type { CollectionEntry } from 'astro:content';
import { postUrl, publishedPosts, toMarkdown } from '../../../helpers/llm';

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await publishedPosts();
  return posts.map((post) => ({
    params: { slug: post.id.replace(/\/index$/, '') },
    props: { post },
  }));
};

export const GET: APIRoute = ({ props, site }) => {
  const post = props.post as CollectionEntry<'blog'>;
  return new Response(toMarkdown(post, postUrl(post.id), site!), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
