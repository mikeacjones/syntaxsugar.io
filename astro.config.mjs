import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import rehypeExternalLinks from 'rehype-external-links';
import { readFileSync } from 'fs';
import { parse as parsePlist } from 'fast-plist';
import { bundledLanguages } from 'shiki';
import remarkCleanLang from './src/plugins/remark-clean-lang.mjs';

// Load custom TextMate grammars from vendor VSIX extracts
const dwGrammarRaw = readFileSync(new URL('./vendor/data-weave.tmLanguage', import.meta.url), 'utf-8');
const dwGrammar = parsePlist(dwGrammarRaw);

const ramlGrammarRaw = readFileSync(new URL('./vendor/raml.tmLanguage', import.meta.url), 'utf-8');
const ramlGrammar = parsePlist(ramlGrammarRaw);

const dataWeaveLang = {
  ...dwGrammar,
  name: 'dataweave',
  aliases: ['data-weave', 'dwl', 'DataWeave'],
};

const ramlLang = {
  ...ramlGrammar,
  name: 'raml',
  aliases: ['RAML'],
};

export default defineConfig({
  site: 'https://syntaxsugar.io',
  image: {
    service: { entrypoint: 'astro/assets/services/noop' },
  },
  integrations: [
    mdx(),
    sitemap(),
  ],
  markdown: {
    shikiConfig: {
      theme: 'material-theme-palenight',
      wrap: true,
      langs: [...Object.keys(bundledLanguages), dataWeaveLang, ramlLang],
    },
    remarkPlugins: [remarkCleanLang],
    rehypePlugins: [
      [rehypeExternalLinks, { target: '_blank', rel: ['noreferrer'] }],
    ],
  },
});
