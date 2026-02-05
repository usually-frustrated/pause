/**
 * Template management: parsing, cloning, and manifest loading
 * Supports three-tier template system:
 *   1. Built-in templates (in this repo)
 *   2. Official templates (pause-org/pause-templates)
 *   3. Custom templates (any GitHub repo)
 */

import * as core from "@actions/core";
import * as exec from "@actions/exec";
import { readFile, access } from "fs/promises";
import { join, basename, dirname, resolve } from "path";
import { parse as parseYaml } from "yaml";
import type { TemplateManifest } from "./types";

const WORK_DIR = process.env.RUNNER_TEMP || "/tmp/pause-templates";
const BUILTIN_TEMPLATES_DIR = resolve(__dirname, "../templates");

/**
 * Parse the templates input string into template references
 * Supports three tiers:
 *   1. Built-in: "minimal", "modern", "simple" or "builtin:minimal"
 *   2. Official: "official:template-name" (from pause-org/pause-templates)
 *   3. Custom: "github:owner/repo", "https://github.com/owner/repo", or "owner/repo"
 */
export function parseTemplates(templatesInput: string): string[] {
  const lines = templatesInput
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  return lines.map((line) => {
    // Handle builtin: prefix or known builtin names
    const builtinTemplates = ["latex-template", "typst-template", "html-template"];
    if (line.startsWith("builtin:")) {
      return line; // Keep as-is: builtin:latex-minimal
    }
    if (builtinTemplates.includes(line)) {
      return `builtin:${line}`; // Convert to: builtin:latex-minimal
    }

    // Handle official: prefix
    if (line.startsWith("official:")) {
      const templateName = line.replace("official:", "");
      return `https://github.com/pause-org/pause-templates/${templateName}`;
    }

    // Handle github: prefix
    if (line.startsWith("github:")) {
      const repo = line.replace("github:", "");
      return `https://github.com/${repo}`;
    }

    // Handle full URLs
    if (line.startsWith("http://") || line.startsWith("https://")) {
      return line;
    }

    // Default to GitHub
    return `https://github.com/${line}`;
  });
}

/**
 * Resolve a template to its local path
 * For built-in templates, returns the path in the action repo
 * For external templates, clones them to WORK_DIR
 */
export async function resolveTemplate(
  templateRef: string,
  githubToken: string,
): Promise<string> {
  // Check if it's a built-in template
  if (templateRef.startsWith("builtin:")) {
    const templateName = templateRef.replace("builtin:", "");
    const templatePath = join(BUILTIN_TEMPLATES_DIR, templateName);

    // Verify the built-in template exists
    try {
      await access(templatePath);
      core.info(`✅ Using built-in template: ${templateName}`);
      return templatePath;
    } catch {
      throw new Error(
        `Built-in template "${templateName}" not found. ` +
        `Available templates: latex-template, typst-template, html-template`,
      );
    }
  }

  // External template - clone it
  return await cloneTemplate(templateRef, githubToken);
}

/**
 * Clone a template repository to a local path
 * Uses gh CLI for authentication support
 */
export async function cloneTemplate(
  templateUrl: string,
  githubToken: string,
): Promise<string> {
  const repoName = basename(templateUrl.replace(".git", ""));
  const localPath = join(WORK_DIR, repoName);

  // Set GitHub token for gh CLI
  process.env.GH_TOKEN = githubToken;

  // Clone using gh CLI (supports private repos)
  const cloneUrl = templateUrl.replace("https://github.com/", "");

  core.info(`📥 Cloning template: ${cloneUrl}`);

  try {
    // First try to clone from main branch
    await exec.exec("gh", [
      "repo",
      "clone",
      cloneUrl,
      localPath,
      "--",
      "--branch=main",
      "--depth=1",
    ]);
  } catch (error) {
    // If main branch doesn't exist, fall back to default branch
    core.info(`⚠️ Main branch not found, falling back to default branch`);
    await exec.exec("gh", [
      "repo",
      "clone",
      cloneUrl,
      localPath,
      "--",
      "--depth=1",
    ]);
  }

  return localPath;
}

/**
 * Load and parse the template manifest file
 * Supports: template.yaml, template.yml, template.json
 */
export async function loadManifest(
  templatePath: string,
): Promise<TemplateManifest> {
  const manifestFiles = [
    "template.yaml",
    "template.yml",
    "template.json",
    "template.toml",
  ];

  let manifestContent: string | null = null;
  let manifestFile: string | null = null;

  // Find the first existing manifest file
  for (const file of manifestFiles) {
    const filePath = join(templatePath, file);
    try {
      await access(filePath);
      manifestContent = await readFile(filePath, "utf-8");
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
      `Expected one of: ${manifestFiles.join(", ")}`,
    );
  }

  // Parse based on file type
  let manifest: TemplateManifest;

  if (manifestFile.endsWith(".json")) {
    manifest = JSON.parse(manifestContent);
  } else if (manifestFile.endsWith(".yaml") || manifestFile.endsWith(".yml")) {
    manifest = parseYaml(manifestContent);
  } else {
    throw new Error(`Unsupported manifest format: ${manifestFile}`);
  }

  // Validate required fields
  validateManifest(manifest);

  // Set default delimiters if not specified
  if (!manifest.delimiters) {
    manifest.delimiters = ["[[", "]]"];
  }

  return manifest;
}

/**
 * Validate that the manifest has all required fields
 */
function validateManifest(manifest: any): asserts manifest is TemplateManifest {
  const requiredFields = ["name", "type", "entrypoint", "output_name"];
  const missingFields = requiredFields.filter((field) => !(field in manifest));

  if (missingFields.length > 0) {
    throw new Error(
      `Template manifest is missing required fields: ${missingFields.join(", ")}`,
    );
  }

  const validTypes = ["latex", "typst", "html", "markdown"];
  if (!validTypes.includes(manifest.type)) {
    throw new Error(
      `Invalid template type: ${manifest.type}. ` +
      `Must be one of: ${validTypes.join(", ")}`,
    );
  }
}
