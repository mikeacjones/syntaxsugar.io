import type { APIRoute, GetStaticPaths } from 'astro';
import type { CollectionEntry } from 'astro:content';
import { labUrl, publishedLabs, toMarkdown } from '../../../helpers/llm';

export const getStaticPaths: GetStaticPaths = async () => {
  const labs = await publishedLabs();
  return labs.map((lab) => ({
    params: { slug: lab.id.replace(/\/index$/, '') },
    props: { lab },
  }));
};

export const GET: APIRoute = ({ props, site }) => {
  const lab = props.lab as CollectionEntry<'labs'>;
  return new Response(toMarkdown(lab, labUrl(lab.id), site!), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
