// Frontmatter dates are calendar dates parsed as UTC midnight; format them in
// UTC so they don't slip back a day when the build runs west of Greenwich.
export function formatDate(date: Date, month: 'long' | 'short' = 'long'): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month,
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function tagSlug(tag: string): string {
  return tag.replace(/(\s|_|-)+/g, '-').toLowerCase();
}

export function postUrl(id: string): string {
  // id is like "2023/bola/index"; posts live at /post/{year}/{slug}/
  const parts = id.replace(/\/index$/, '').split('/');
  return `/post/${parts[0]}/${parts.slice(1).join('/')}/`;
}

// "75 min" or "2 hours" as an ISO 8601 duration ("PT75M"), for schema.org timeRequired.
export function isoDuration(duration?: string): string | undefined {
  const match = duration && /(\d+)\s*(h|hr|hour|m|min|minute)s?\b/i.exec(duration);
  if (!match) return undefined;
  return `PT${match[1]}${match[2][0].toLowerCase() === 'h' ? 'H' : 'M'}`;
}
