import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHighlighter } from 'shiki';
import { parse as parsePlist } from 'fast-plist';

export interface ClaatStep {
  label: string;
  duration: number;
  content: string;
}

export interface ClaatLab {
  id: string;
  title: string;
  steps: ClaatStep[];
}

function detectLanguage(code: string): string | null {
  const trimmed = code.trimStart();
  if (trimmed.startsWith('#%RAML')) return 'raml';
  if (trimmed.startsWith('<?xml') || trimmed.startsWith('<mule')) return 'xml';
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json';
  if (trimmed.startsWith('&lt;')) return 'xml';
  if (/^(name|on|jobs|steps|env|runs-on):/.test(trimmed)) return 'yaml';
  if (trimmed.startsWith('---\n')) return 'yaml';
  if (/^(FROM|RUN|COPY|CMD|ENTRYPOINT)\s/m.test(trimmed)) return 'dockerfile';
  if (/^\$\s|^#!/.test(trimmed)) return 'shell';
  if (/^(mvn |gradle |\.\/)/.test(trimmed)) return 'shell';
  if (/&lt;dependencies&gt;|&lt;build&gt;|&lt;plugin&gt;|&lt;groupId&gt;/.test(trimmed)) return 'xml';
  return null;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

let highlighterPromise: ReturnType<typeof createHighlighter> | null = null;

async function getHighlighter() {
  if (!highlighterPromise) {
    const ramlRaw = readFileSync(join(process.cwd(), 'vendor', 'raml.tmLanguage'), 'utf-8');
    const ramlGrammar = parsePlist(ramlRaw);
    const ramlLang = { ...ramlGrammar, name: 'raml', aliases: ['RAML'] } as any;

    highlighterPromise = createHighlighter({
      themes: ['material-theme-palenight'],
      langs: ['xml', 'json', 'yaml', 'shell', 'dockerfile', ramlLang],
    });
  }
  return highlighterPromise;
}

async function highlightCode(code: string, lang: string): Promise<string> {
  const highlighter = await getHighlighter();
  return highlighter.codeToHtml(code, {
    lang,
    theme: 'material-theme-palenight',
  });
}

export async function parseClaatHtml(slug: string, basePath: string): Promise<ClaatLab | null> {
  const htmlPath = join(basePath, slug, 'raw.html');
  if (!existsSync(htmlPath)) return null;

  const html = readFileSync(htmlPath, 'utf-8');

  const titleMatch = html.match(/<google-codelab[^>]+title="([^"]+)"/);
  const title = titleMatch?.[1] ?? slug;

  const idMatch = html.match(/<google-codelab[^>]+id="([^"]+)"/);
  const id = idMatch?.[1] ?? slug;

  const stepRegex = /<google-codelab-step\s+label="([^"]*)"(?:\s+duration="(\d+)")?[^>]*>([\s\S]*?)<\/google-codelab-step>/g;
  const steps: ClaatStep[] = [];
  let match;

  while ((match = stepRegex.exec(html)) !== null) {
    let content = match[3].trim();
    content = content.replace(/src="img\//g, `src="/lab-content/${slug}/img/`);
    content = content.replace(/(<img[^>]*)\s+style="[^"]*"/g, '$1');

    const codeBlockRegex = /<pre><code>([\s\S]*?)<\/code><\/pre>/g;
    const replacements: { original: string; replacement: string }[] = [];
    let codeMatch;

    while ((codeMatch = codeBlockRegex.exec(content)) !== null) {
      const rawCode = codeMatch[1];
      const lang = detectLanguage(rawCode);
      if (lang) {
        const decoded = decodeHtmlEntities(rawCode);
        const highlighted = await highlightCode(decoded, lang);
        replacements.push({ original: codeMatch[0], replacement: highlighted });
      } else {
        replacements.push({
          original: codeMatch[0],
          replacement: `<pre class="astro-code"><code>${rawCode}</code></pre>`,
        });
      }
    }

    for (const { original, replacement } of replacements) {
      content = content.replace(original, replacement);
    }

    steps.push({
      label: match[1],
      duration: parseInt(match[2] || '0', 10),
      content,
    });
  }

  return { id, title, steps };
}
