#!/usr/bin/env node

/**
 * Pulls each course listed in courses/*.json from GitHub and writes it to
 * .courses/ as Markdown that the `courses` and `courseLessons` collections load.
 *
 * A course repo is expected to look like temporal-course-wordflow:
 *   - README.md on the default branch: the course overview.
 *   - site/_sidebar.md (optional): the lesson order and sections. Without it,
 *     every course/<lesson>/README.md is a lesson, in path order.
 *   - Each lesson README links to `build.md`. Every other branch that has that
 *     build.md is a language, and its steps are inlined into the lesson.
 *
 * Usage:
 *   node scripts/sync-courses.mjs          # pull every course
 *   node scripts/sync-courses.mjs wordflow # pull some
 *
 * The site build runs this through the course-sync integration in astro.config.mjs.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, posix, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const CONFIG_DIR = join(ROOT, 'courses');
export const OUTPUT_DIR = join(ROOT, '.courses');

const LANGUAGE_LABELS = {
  go: 'Go',
  python: 'Python',
  typescript: 'TypeScript',
  ts: 'TypeScript',
  java: 'Java',
  dotnet: '.NET',
  csharp: 'C#',
  ruby: 'Ruby',
  php: 'PHP',
  rust: 'Rust',
};

// The line a lesson README uses to point at its language-specific steps.
const BUILD_LINK = /^Follow \[`?build\.md`?\]\(build\.md\)\.?[ \t]*$/m;

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function gitBuffer(cwd, ...args) {
  return execFileSync('git', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 });
}

export function courseConfigs() {
  if (!existsSync(CONFIG_DIR)) return [];
  return readdirSync(CONFIG_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => ({ id: f.replace(/\.json$/, ''), ...JSON.parse(readFileSync(join(CONFIG_DIR, f), 'utf-8')) }));
}

export function isSynced(id) {
  return existsSync(join(OUTPUT_DIR, id, 'index.md'));
}

// A shallow clone with the tip of every branch, read with `git show <branch>:<path>`.
function clone(repo) {
  const dir = mkdtempSync(join(tmpdir(), 'course-'));
  git(dir, 'clone', '--quiet', '--depth', '1', '--no-single-branch', '--no-checkout', `https://github.com/${repo}.git`, '.');
  const head = git(dir, 'symbolic-ref', '--short', 'refs/remotes/origin/HEAD').trim();
  const defaultBranch = head.replace(/^origin\//, '');
  const branches = git(dir, 'for-each-ref', '--format=%(refname:short)', 'refs/remotes/origin')
    .split('\n')
    .map((b) => b.trim().replace(/^origin\//, ''))
    .filter((b) => b && b !== 'HEAD' && b !== 'origin' && b !== defaultBranch);
  return { dir, defaultBranch, branches };
}

function makeReader(dir) {
  const files = new Map();
  return {
    list(branch) {
      if (!files.has(branch)) {
        files.set(branch, new Set(git(dir, 'ls-tree', '-r', '--name-only', `origin/${branch}`).split('\n').filter(Boolean)));
      }
      return files.get(branch);
    },
    has(branch, path) {
      return this.list(branch).has(path);
    },
    text(branch, path) {
      return git(dir, 'show', `origin/${branch}:${path}`);
    },
    buffer(branch, path) {
      return gitBuffer(dir, 'show', `origin/${branch}:${path}`);
    },
    date(branch) {
      return git(dir, 'log', '-1', '--format=%cI', `origin/${branch}`).trim();
    },
  };
}

// Calls fn on each stretch of Markdown outside code fences and inline code.
function mapProse(md, fn) {
  let fence = null;
  return md
    .split('\n')
    .map((line) => {
      const open = /^\s*(`{3,}|~{3,})/.exec(line);
      if (fence) {
        if (open && open[1][0] === fence[0] && open[1].length >= fence.length) fence = null;
        return line;
      }
      if (open) {
        fence = open[1];
        return line;
      }
      // Mask inline code rather than splitting on it, so a link whose label is code still matches.
      const spans = [];
      const masked = line.replace(/`+[^`]*`+/g, (span) => `\u0000${spans.push(span) - 1}\u0000`);
      return fn(masked).replace(/\u0000(\d+)\u0000/g, (_, i) => spans[i]);
    })
    .join('\n');
}

// build.md is nested under the lesson's "Build it" heading: drop its title and
// push every heading down a level.
function nestHeadings(md) {
  let titleDropped = false;
  let fence = null;
  return md
    .split('\n')
    .flatMap((line) => {
      const open = /^\s*(`{3,}|~{3,})/.exec(line);
      if (fence) {
        if (open && open[1][0] === fence[0] && open[1].length >= fence.length) fence = null;
        return [line];
      }
      if (open) {
        fence = open[1];
        return [line];
      }
      if (!titleDropped && /^# /.test(line)) {
        titleDropped = true;
        return [];
      }
      return [/^#{1,5} /.test(line) ? `#${line}` : line];
    })
    .join('\n');
}

function splitTitle(md) {
  const match = /^# (.+)\n+/m.exec(md);
  if (!match) return { title: null, body: md };
  return { title: match[1].trim(), body: md.slice(0, match.index) + md.slice(match.index + match[0].length) };
}

// Drops whole `## Heading` sections by name.
function omitSections(md, names) {
  if (!names?.length) return md;
  const drop = new Set(names.map((n) => n.toLowerCase()));
  const out = [];
  let skipping = false;
  let fence = null;
  for (const line of md.split('\n')) {
    const open = /^\s*(`{3,}|~{3,})/.exec(line);
    if (!fence) {
      const heading = /^## (.+)$/.exec(line);
      if (heading) skipping = drop.has(heading[1].trim().toLowerCase());
    }
    if (fence) {
      if (open && open[1][0] === fence[0] && open[1].length >= fence.length) fence = null;
    } else if (open) {
      fence = open[1];
    }
    if (!skipping) out.push(line);
  }
  return out.join('\n');
}

function plainText(md) {
  return md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// The first paragraph, minus a leading "**Goal:**"-style label, cut to fit a meta description.
function summarize(body) {
  const para = body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .find((p) => p && !/^(#|\||!\[|```|<|- |\* |\d+\. |>)/.test(p));
  if (!para) return '';
  let text = plainText(para.replace(/^\*\*[^*]+:\*\*\s*/, ''));
  text = text.charAt(0).toUpperCase() + text.slice(1);
  if (text.length <= 160) return text;
  return `${text.slice(0, 157).replace(/\s+\S*$/, '')}…`;
}

function slugFor(path, taken) {
  const parts = path.replace(/\.md$/i, '').split('/');
  const file = parts.pop();
  let slug = (/^readme$/i.test(file) ? parts.pop() : file) ?? 'index';
  while (taken.has(slug) && parts.length) slug = `${parts.pop()}-${slug}`;
  taken.add(slug);
  return slug.toLowerCase();
}

// Lessons in order, grouped into sections, from the course's own sidebar.
function readOutline(reader, branch, sidebarPath) {
  const pages = [];
  if (sidebarPath && reader.has(branch, sidebarPath)) {
    let section = 'Lessons';
    for (const line of reader.text(branch, sidebarPath).split('\n')) {
      const item = /^(\s*)[-*] (.+)$/.exec(line);
      if (!item) continue;
      const link = /\[([^\]]+)\]\(([^)\s]+)\)/.exec(item[2]);
      if (!link) {
        if (!item[1]) section = item[2].trim();
        continue;
      }
      const path = link[2].replace(/^\//, '').replace(/#.*$/, '');
      // Top-level links are the docsify home page; the README covers that.
      if (!item[1] || /^https?:/.test(link[2]) || !path.endsWith('.md') || !reader.has(branch, path)) continue;
      pages.push({ path, section, navTitle: link[1].trim() });
    }
  }
  if (pages.length === 0) {
    for (const path of [...reader.list(branch)].sort()) {
      if (/^course\/.+\/README\.md$/i.test(path)) pages.push({ path, section: 'Lessons' });
    }
  }
  return pages;
}

function syncCourse(config, logger) {
  const { id, repo } = config;
  const { dir, defaultBranch, branches } = clone(repo);
  try {
    const reader = makeReader(dir);
    const updated = reader.date(defaultBranch);
    const github = (branch, path) => `https://github.com/${repo}/blob/${branch}/${path}`;

    const outline = readOutline(reader, defaultBranch, config.sidebar ?? 'site/_sidebar.md');
    const taken = new Set();
    for (const page of outline) page.slug = slugFor(page.path, taken);
    const pageUrls = new Map(outline.map((p) => [p.path, `/course/${id}/${p.slug}/`]));

    const languages = branches
      .filter((branch) => outline.some((p) => reader.has(branch, posix.join(posix.dirname(p.path), 'build.md'))))
      .map((branch) => ({
        branch,
        label: config.languages?.[branch] ?? LANGUAGE_LABELS[branch] ?? branch.charAt(0).toUpperCase() + branch.slice(1),
        codespace: `https://codespaces.new/${repo}?ref=${encodeURIComponent(branch)}`,
      }));

    const staging = join(OUTPUT_DIR, `.${id}-staging`);
    rmSync(staging, { recursive: true, force: true });

    // Points links at the site's course pages, copies images next to the page,
    // and sends everything else in the repo to GitHub.
    function rewriteLinks(md, branch, srcPath, outDir) {
      const base = new URL(github(branch, srcPath));
      return mapProse(md, (text) =>
        text.replace(/(!?)\[([^\]]*)\]\(([^)\s]+)((?:\s+"[^"]*")?)\)/g, (whole, bang, label, target, title) => {
          if (/^(#|mailto:)/.test(target)) return whole;
          const url = target.startsWith('/') && !target.startsWith('//')
            ? new URL(github(branch, target.slice(1)))
            : new URL(target, base);
          const prefix = `/${repo}/blob/${branch}/`;
          if (url.origin !== 'https://github.com' || !url.pathname.startsWith(prefix)) {
            return `${bang}[${label}](${url.href}${title})`;
          }
          const path = decodeURIComponent(url.pathname.slice(prefix.length));
          if (pageUrls.has(path)) return `${bang}[${label}](${pageUrls.get(path)}${url.hash}${title})`;
          if (bang && reader.has(branch, path)) {
            const rel = posix.relative(posix.dirname(srcPath), path);
            const local = rel.startsWith('..') ? posix.join('_assets', path.replaceAll('/', '-')) : rel;
            const dest = join(outDir, local);
            mkdirSync(dirname(dest), { recursive: true });
            writeFileSync(dest, reader.buffer(branch, path));
            return `![${label}](./${local}${title})`;
          }
          return `${bang}[${label}](${url.href}${title})`;
        }),
      );
    }

    const pages = [];
    outline.forEach((page, order) => {
      const outDir = join(staging, page.slug);
      mkdirSync(outDir, { recursive: true });
      const { title, body: readme } = splitTitle(reader.text(defaultBranch, page.path));
      // Swap the build.md line for a marker first, so the link rewrite leaves it alone.
      const BUILD_MARKER = '%%BUILD_STEPS%%';
      let body = rewriteLinks(readme.replace(BUILD_LINK, BUILD_MARKER), defaultBranch, page.path, outDir);

      if (body.includes(BUILD_MARKER)) {
        const buildPath = posix.join(posix.dirname(page.path), 'build.md');
        const panels = languages
          .filter((lang) => reader.has(lang.branch, buildPath))
          .map((lang) => {
            const steps = rewriteLinks(nestHeadings(reader.text(lang.branch, buildPath)), lang.branch, buildPath, outDir);
            return `<div class="CourseLang" data-lang="${lang.branch}" data-label="${lang.label}">\n\n${steps.trim()}\n\n</div>`;
          });
        const fallback = `The build steps for this lesson live on each language branch of [the course repository](https://github.com/${repo}).`;
        body = body.replace(BUILD_MARKER, () => (panels.length ? panels.join('\n\n') : fallback));
      }

      const data = {
        course: id,
        title: title ?? page.navTitle ?? page.slug,
        navTitle: page.navTitle ?? title ?? page.slug,
        section: page.section,
        order,
        shortDescription: summarize(readme),
        updated,
        source: github(defaultBranch, page.path),
      };
      pages.push({ slug: page.slug, title: data.navTitle, section: page.section });
      writeFileSync(join(outDir, 'index.md'), `---\n${frontmatter(data)}---\n\n${body.trim()}\n`);
    });

    const { title: readmeTitle, body: readmeBody } = splitTitle(reader.text(defaultBranch, 'README.md'));
    const overview = rewriteLinks(omitSections(readmeBody, config.omitSections), defaultBranch, 'README.md', staging);
    const title = config.title ?? readmeTitle ?? id;
    const course = {
      title,
      shortTitle: config.shortTitle ?? title.split(':')[0].trim(),
      shortDescription: config.shortDescription ?? summarize(readmeBody),
      date: config.date ?? updated,
      updated,
      categories: config.categories ?? [],
      published: config.published ?? true,
      duration: config.duration,
      repo,
      defaultBranch,
      languages,
      pages,
    };
    writeFileSync(join(staging, 'index.md'), `---\n${frontmatter(course)}---\n\n${overview.trim()}\n`);

    const target = join(OUTPUT_DIR, id);
    rmSync(target, { recursive: true, force: true });
    renameSync(staging, target);
    logger.info(`Synced course "${id}": ${pages.length} pages, languages: ${languages.map((l) => l.label).join(', ') || 'none'}.`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// JSON is valid YAML, so each value is written as JSON.
function frontmatter(data) {
  return Object.entries(data)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}\n`)
    .join('');
}

/**
 * @param {{ only?: string[], refresh?: boolean, strict?: boolean, logger?: { info: Function, warn: Function } }} options
 *   refresh: pull courses that are already synced. strict: throw when a course
 *   can't be pulled and there is no earlier copy to fall back on.
 */
export function syncCourses({ only, refresh = true, strict = false, logger = console } = {}) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const configs = courseConfigs().filter((c) => !only?.length || only.includes(c.id));
  const ids = new Set(courseConfigs().map((c) => c.id));
  for (const entry of readdirSync(OUTPUT_DIR)) {
    if (!ids.has(entry)) rmSync(join(OUTPUT_DIR, entry), { recursive: true, force: true });
  }
  for (const config of configs) {
    if (!refresh && isSynced(config.id)) continue;
    try {
      syncCourse(config, logger);
    } catch (err) {
      const reason = err.stderr?.toString().trim() || err.message;
      if (isSynced(config.id)) {
        logger.warn(`Couldn't pull course "${config.id}", using the last copy: ${reason}`);
      } else if (strict) {
        throw new Error(`Couldn't pull course "${config.id}" from ${config.repo}: ${reason}`);
      } else {
        logger.warn(`Couldn't pull course "${config.id}", skipping it: ${reason}`);
      }
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  syncCourses({ only: process.argv.slice(2), strict: true });
}
