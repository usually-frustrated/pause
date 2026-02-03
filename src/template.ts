/**
 * Template management: parsing, cloning, and manifest loading
 */

import * as core from '@actions/core';
import * as exec from '@actions/exec';
import { readFile, access } from 'fs/promises';
import { join, basename } from 'path';
import { parse as parseYaml } from 'yaml';
import type { TemplateManifest } from './types';

const WORK_DIR = process.env.RUNNER_TEMP || '/tmp/pause-templates';

/**
 * Parse the templates input string into individual template URLs
 * Supports:
 *   - github:owner/repo
 *   - https://github.com/owner/repo
 *   - owner/repo (assumes GitHub)
 */
export function parseTemplates(templatesInput: string): string[] {
  const lines = templatesInput
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'));

  return lines.map(line => {
    // Handle github:owner/repo format
    if (line.startsWith('github:')) {
      const repo = line.replace('github:', '');
      return `https://github.com/${repo}`;
    }

    // Handle full URLs
    if (line.startsWith('http://') || line.startsWith('https://')) {
      return line;
    }

    // Default to GitHub
    return `https://github.com/${line}`;
  });
}

/**
 * Clone a template repository to a local path
 * Uses gh CLI for authentication support
 */
export async function cloneTemplate(
  templateUrl: string,
  githubToken: string
): Promise<string> {
  const repoName = basename(templateUrl.replace('.git', ''));
  const localPath = join(WORK_DIR, repoName);

  // Set GitHub token for gh CLI
  process.env.GH_TOKEN = githubToken;

  // Clone using gh CLI (supports private repos)
  const cloneUrl = templateUrl.replace('https://github.com/', '');

  await exec.exec('gh', [
    'repo',
    'clone',
    cloneUrl,
    localPath,
    '--',
    '--depth=1'
  ]);

  return localPath;
}

/**
 * Load and parse the template manifest file
 * Supports: template.yaml, template.yml, template.json
 */
export async function loadManifest(templatePath: string): Promise<TemplateManifest> {
  const manifestFiles = [
    'template.yaml',
    'template.yml',
    'template.json',
    'template.toml'
  ];

  let manifestContent: string | null = null;
  let manifestFile: string | null = null;

  // Find the first existing manifest file
  for (const file of manifestFiles) {
    const filePath = join(templatePath, file);
    try {
      await access(filePath);
      manifestContent = await readFile(filePath, 'utf-8');
      manifestFile = file;
      break;
    } catch {
      // File doesn't exist, try next
      continue;
    }
  }

  if (!manifestContent || !manifestFile) {
    throw new Error(
      `No template manifest found in ${templatePath}. ` +
      `Expected one of: ${manifestFiles.join(', ')}`
    );
  }

  // Parse based on file type
  let manifest: TemplateManifest;

  if (manifestFile.endsWith('.json')) {
    manifest = JSON.parse(manifestContent);
  } else if (manifestFile.endsWith('.yaml') || manifestFile.endsWith('.yml')) {
    manifest = parseYaml(manifestContent);
  } else {
    throw new Error(`Unsupported manifest format: ${manifestFile}`);
  }

  // Validate required fields
  validateManifest(manifest);

  // Set default delimiters if not specified
  if (!manifest.delimiters) {
    manifest.delimiters = ['[[', ']]'];
  }

  return manifest;
}

/**
 * Validate that the manifest has all required fields
 */
function validateManifest(manifest: any): asserts manifest is TemplateManifest {
  const requiredFields = ['name', 'type', 'entrypoint', 'output_name'];
  const missingFields = requiredFields.filter(field => !(field in manifest));

  if (missingFields.length > 0) {
    throw new Error(
      `Template manifest is missing required fields: ${missingFields.join(', ')}`
    );
  }

  const validTypes = ['latex', 'typst', 'html', 'markdown'];
  if (!validTypes.includes(manifest.type)) {
    throw new Error(
      `Invalid template type: ${manifest.type}. ` +
      `Must be one of: ${validTypes.join(', ')}`
    );
  }
}
