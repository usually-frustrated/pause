/**
 * Utility functions for sanitization and helpers
 */

/**
 * Escape special LaTeX characters
 * Characters that need escaping: & % $ # _ { } ~ ^ \
 */
export function escapeLatex(text: string): string {
  if (!text) return '';

  return text
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
}

/**
 * Escape HTML entities
 */
export function escapeHtml(text: string): string {
  if (!text) return '';

  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Escape special Typst characters
 * Characters that need escaping: * _ ` # [ ] < > @ $
 */
export function escapeTypst(text: string): string {
  if (!text) return '';

  return text
    .replace(/\\/g, '\\\\')
    .replace(/\*/g, '\\*')
    .replace(/_/g, '\\_')
    .replace(/`/g, '\\`')
    .replace(/#/g, '\\#')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/</g, '\\<')
    .replace(/>/g, '\\>')
    .replace(/@/g, '\\@')
    .replace(/\$/g, '\\$');
}

/**
 * Format a date string
 */
export function formatDate(date: string | Date | undefined): string {
  if (!date) return '';

  const d = typeof date === 'string' ? new Date(date) : date;

  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long'
  });
}

/**
 * Join array items with a separator
 */
export function joinArray(items: string[] | undefined, separator = ', '): string {
  if (!items || !Array.isArray(items)) return '';
  return items.join(separator);
}

/**
 * Check if a value is present and not empty
 */
export function isPresent(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}
