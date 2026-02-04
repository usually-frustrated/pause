import { ResumeData } from './types';

/**

import { ResumeData } from "./types";
 * Utility functions for sanitization and helpers
 */

import type { ResumeData } from "./types";

/**
 * Parse artifact name template string with placeholders
 * Supported placeholders:
 * - {name} - Name from resume JSON
 * - {yyyy} - Current year (4 digits)
 * - {MMM} - Current month (3-letter abbreviation)
 */
export function parseArtifactNameTemplate(
  template: string | undefined,
  resumeData: ResumeData,
  date: Date = new Date(),
): string {
  if (!template) {
    return "resume";
  }

  const name = resumeData.basics?.name || "Unknown";
  const year = date.getFullYear().toString();
  const month = date.toLocaleDateString("en-US", { month: "short" });

  return template
    .replace(/{name}/g, name)
    .replace(/{yyyy}/g, year)
    .replace(/{MMM}/g, month);
}

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
 * Deeply escape strings in an object
 */
export function deepEscape(data: any, escapeFn: (text: string) => string): any {
  if (typeof data === 'string') {
    return escapeFn(data);
  }

  if (Array.isArray(data)) {
    return data.map(item => deepEscape(item, escapeFn));
  }

  if (typeof data === 'object' && data !== null) {
    const result: any = {};
    for (const key in data) {
      result[key] = deepEscape(data[key], escapeFn);
    }
    return result;
  }

  return data;
}

/**
 * Prepare resume data for a specific template type
 */
export function prepareResumeData(data: ResumeData, type: string): ResumeData {
  switch (type) {
    case 'latex':
      return deepEscape(data, escapeLatex);
    case 'typst':
      return deepEscape(data, escapeTypst);
    case 'html':
      return deepEscape(data, escapeHtml);
    default:
      return data;
  }
}
