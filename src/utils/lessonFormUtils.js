/**
 * Converts an array of code snippet objects or strings into a single textarea
 * string, with individual snippets separated by `---` delimiter lines.
 *
 * @param {Array<string|{code?: string, content?: string}>} value - Array of snippet strings or objects.
 * @returns {string} A single string with snippets joined by `\n\n---\n\n`, or an empty string.
 */
export function mapCodeSnippetsToTextarea(value) {
  if (!Array.isArray(value) || value.length === 0) return '';

  return value
    .map((snippet) => {
      if (typeof snippet === 'string') return snippet;
      if (snippet && typeof snippet === 'object') return snippet.code ?? snippet.content ?? '';
      return '';
    })
    .filter(Boolean)
    .join('\n\n---\n\n');
}

/**
 * Splits a textarea string of code snippets (separated by `---` delimiter lines)
 * into an array of trimmed, non-empty snippet strings.
 *
 * @param {string} value - Raw textarea value containing snippets separated by `---`.
 * @returns {string[]} Array of trimmed code snippet strings.
 */
export function mapTextareaToCodeSnippets(value) {
  if (typeof value !== 'string') return [];
  if (!value.trim()) return [];

  return value
    .split(/\n\s*---\s*\n/g)
    .map((snippet) => snippet.trim())
    .filter(Boolean);
}

/**
 * Returns the Tailwind CSS class string for a lesson status badge.
 *
 * @param {'published'|'archived'|'draft'} status - The lesson's publication status.
 * @returns {string} Tailwind CSS background and text color classes for the badge.
 */
export function badgeClass(status) {
  if (status === 'published') return 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-200';
  if (status === 'archived') return 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200';
  return 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-200';
}