/**
 * Build orchestration: binary installation, template rendering, and compilation
 */

import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as tc from '@actions/tool-cache';
import { writeFile, readFile, mkdir, chmod } from 'fs/promises';
import { join, dirname, basename, extname } from 'path';
import type { TemplateManifest, ResumeData } from './types';
import { escapeLatex, escapeHtml, escapeTypst } from './utils';

const BIN_DIR = process.env.RUNNER_TEMP ? join(process.env.RUNNER_TEMP, 'pause-bin') : '/tmp/pause-bin';
const OUTPUT_DIR = process.env.GITHUB_WORKSPACE || process.cwd();

interface BinaryInfo {
  name: string;
  version: string;
  url: string;
  extractDir?: string;
}

/**
 * Install required binaries: Gomplate, Tectonic, Typst
 * Uses GitHub Actions tool cache for caching
 */
export async function installBinaries(): Promise<void> {
  const os = process.platform;
  const arch = process.arch;

  core.info(`Detected platform: ${os}, architecture: ${arch}`);

  const binaries: BinaryInfo[] = [];

  // 1. Gomplate
  let gomplateUrl = "";
  if (os === 'linux') {
    gomplateUrl = `https://github.com/hairyhenderson/gomplate/releases/download/v4.3.0/gomplate_linux-${arch === 'arm64' ? 'arm64' : 'amd64'}`;
  } else if (os === 'darwin') {
    gomplateUrl = `https://github.com/hairyhenderson/gomplate/releases/download/v4.3.0/gomplate_darwin-${arch === 'arm64' ? 'arm64' : 'amd64'}`;
  }

  if (gomplateUrl) {
    binaries.push({
      name: 'gomplate',
      version: '4.3.0',
      url: gomplateUrl
    });
  }

  // 2. Tectonic
  let tectonicUrl = "";
  let tectonicExtractDir = ".";
  if (os === 'linux') {
    tectonicUrl = `https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%400.15.0/tectonic-0.15.0-${arch === 'arm64' ? 'aarch64' : 'x86_64'}-unknown-linux-musl.tar.gz`;
  } else if (os === 'darwin') {
    tectonicUrl = `https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%400.15.0/tectonic-0.15.0-${arch === 'arm64' ? 'aarch64' : 'x86_64'}-apple-darwin.tar.gz`;
  }

  if (tectonicUrl) {
    binaries.push({
      name: 'tectonic',
      version: '0.15.0',
      url: tectonicUrl,
      extractDir: tectonicExtractDir
    });
  }

  // 3. Typst
  let typstUrl = "";
  let typstExtractDir = "";
  if (os === 'linux') {
    const tArch = arch === 'arm64' ? 'aarch64' : 'x86_64';
    typstUrl = `https://github.com/typst/typst/releases/download/v0.11.0/typst-${tArch}-unknown-linux-musl.tar.xz`;
    typstExtractDir = `typst-${tArch}-unknown-linux-musl`;
  } else if (os === 'darwin') {
    const tArch = arch === 'arm64' ? 'aarch64-apple-darwin' : 'x86_64-apple-darwin';
    typstUrl = `https://github.com/typst/typst/releases/download/v0.11.0/typst-${tArch}.tar.xz`;
    typstExtractDir = `typst-${tArch}`;
  }

  if (typstUrl) {
    binaries.push({
      name: 'typst',
      version: '0.11.0',
      url: typstUrl,
      extractDir: typstExtractDir
    });
  }

  await mkdir(BIN_DIR, { recursive: true });

  for (const binary of binaries) {
    const cachedPath = tc.find(binary.name, binary.version);

    if (cachedPath) {
      core.info(`✅ ${binary.name} v${binary.version} (cached)`);
      core.addPath(cachedPath);
      continue;
    }

    core.info(`📥 Downloading ${binary.name} v${binary.version}...`);
    const downloadPath = await tc.downloadTool(binary.url);

    let toolPath: string;

    if (binary.extractDir) {
      // Extract archive
      if (binary.url.endsWith('.tar.gz')) {
        const extractPath = await tc.extractTar(downloadPath);
        toolPath = join(extractPath, binary.extractDir);
        core.info(`Debug: extractPath=${extractPath}, extractDir=${binary.extractDir}, toolPath=${toolPath}`);
      } else if (binary.url.endsWith('.tar.xz')) {
        const extractPath = await tc.extractTar(downloadPath, undefined, 'x');
        toolPath = join(extractPath, binary.extractDir);
        core.info(`Debug: extractPath=${extractPath}, extractDir=${binary.extractDir}, toolPath=${toolPath}`);
      } else {
        throw new Error(`Unsupported archive format: ${binary.url}`);
      }

      try {
        const stats = await import('fs/promises').then(fs => fs.stat(toolPath));
        core.info(`Debug: toolPath exists, isDirectory=${stats.isDirectory()}`);
      } catch (e) {
        core.info(`Debug: toolPath does not exist or error: ${e}`);
      }

    } else {
      // Single binary file
      // Use a specific directory for this tool to avoid caching unrelated files
      toolPath = join(BIN_DIR, `${binary.name}-${binary.version}`);
      const binPath = join(toolPath, binary.name);

      await mkdir(toolPath, { recursive: true });
      await Bun.write(binPath, Bun.file(downloadPath));
      await chmod(binPath, 0o755);
    }

    // Cache the tool
    const cachedToolPath = await tc.cacheDir(toolPath, binary.name, binary.version);
    core.addPath(cachedToolPath);

    core.info(`✅ Installed ${binary.name} v${binary.version}`);
  }

  // Verify installations
  await exec.exec('gomplate', ['--version']);
  await exec.exec('tectonic', ['--version']);
  await exec.exec('typst', ['--version']);
}

/**
 * Render template using Gomplate
 * Injects resume.json data with custom sanitization functions
 */
export async function renderTemplate(
  templatePath: string,
  manifest: TemplateManifest,
  resumeData: ResumeData
): Promise<string> {
  const entrypointPath = join(templatePath, manifest.entrypoint);
  const templateContent = await readFile(entrypointPath, 'utf-8');

  // Determine output filename
  const outputExt = extname(manifest.entrypoint).replace('.tmpl', '');
  const outputFilename = basename(manifest.entrypoint).replace('.tmpl', '');
  const outputPath = join(OUTPUT_DIR, outputFilename);

  // Create data file for Gomplate
  const dataPath = join(templatePath, '.resume-data.json');
  await writeFile(dataPath, JSON.stringify(resumeData, null, 2));

  // Prepare Gomplate command with custom delimiters and functions
  const [leftDelim, rightDelim] = manifest.delimiters || ['[[', ']]'];

  const args = [
    '--file', entrypointPath,
    '--out', outputPath,
    '--left-delim', leftDelim,
    '--right-delim', rightDelim,
    '--missing-key', 'zero',
    '--context', `.=${dataPath}`
  ];

  await exec.exec('gomplate', args);

  // Post-process: inject custom sanitization functions
  // This is a workaround - ideally we'd use Gomplate plugins
  // For now, we'll rely on template authors to use proper escaping

  core.info(`Rendered ${manifest.entrypoint} -> ${outputPath}`);

  return outputPath;
}

/**
 * Build the rendered template into final output (PDF/HTML)
 */
export async function buildTemplate(
  renderedPath: string,
  manifest: TemplateManifest
): Promise<string> {
  const outputFilename = `${manifest.output_name}.${getOutputExtension(manifest.type)}`;
  const outputPath = join(OUTPUT_DIR, outputFilename);

  if (manifest.build_cmd) {
    // Custom build command
    core.info(`Running custom build command: ${manifest.build_cmd}`);
    await exec.exec('sh', ['-c', manifest.build_cmd]);
    return outputPath;
  }

  // Use default build strategy based on type
  switch (manifest.type) {
    case 'latex':
      await buildLatex(renderedPath, outputPath);
      break;

    case 'typst':
      await buildTypst(renderedPath, outputPath);
      break;

    case 'html':
    case 'markdown':
      // Move/rename rendered file to match output_name
      // The renderedPath is join(OUTPUT_DIR, basename(manifest.entrypoint).replace('.tmpl', ''))
      // We want it at join(OUTPUT_DIR, `${manifest.output_name}.${getOutputExtension(manifest.type)}`)
      if (renderedPath !== outputPath) {
        core.info(`Renaming static output: ${renderedPath} -> ${outputPath}`);
        const fs = await import('fs/promises');
        await fs.rename(renderedPath, outputPath);
      }
      return outputPath;

    default:
      throw new Error(`Unsupported template type: ${manifest.type}`);
  }

  return outputPath;
}

/**
 * Build LaTeX using Tectonic
 */
async function buildLatex(inputPath: string, outputPath: string): Promise<void> {
  core.info(`Building LaTeX with Tectonic: ${inputPath} -> ${outputPath}`);
  core.info(`Input path: ${inputPath}`);
  core.info(`Output directory: ${dirname(outputPath)}`);

  // Tectonic automatically handles package installation
  await exec.exec('tectonic', [
    inputPath,
    '--outdir', dirname(outputPath)
  ]);

  // Rename Tectonic output if it doesn't match outputPath
  const inputBaseName = basename(inputPath).replace(extname(inputPath), '');
  const tectonicExpectedOutput = join(dirname(outputPath), `${inputBaseName}.pdf`);
  core.info(`Expected Tectonic output: ${tectonicExpectedOutput}`);
  core.info(`Final output path: ${outputPath}`);
  
  if (tectonicExpectedOutput !== outputPath) {
    core.info(`Renaming Tectonic output: ${tectonicExpectedOutput} -> ${outputPath}`);
    const fs = await import('fs/promises');
    try {
      await fs.rename(tectonicExpectedOutput, outputPath);
      core.info(`Successfully renamed to: ${outputPath}`);
    } catch (error) {
      core.error(`Failed to rename PDF: ${error}`);
      throw error;
    }
  }
  
  // Verify the final PDF exists
  const fs = await import('fs/promises');
  try {
    await fs.access(outputPath);
    core.info(`✅ PDF verified at: ${outputPath}`);
  } catch (error) {
    core.error(`❌ PDF not found at expected location: ${outputPath}`);
    throw error;
  }
}

/**
 * Build Typst using typst CLI
 */
async function buildTypst(inputPath: string, outputPath: string): Promise<void> {
  core.info('Building Typst document...');

  await exec.exec('typst', [
    'compile',
    inputPath,
    outputPath
  ]);
}

/**
 * Get output file extension for template type
 */
function getOutputExtension(type: TemplateManifest['type']): string {
  switch (type) {
    case 'latex':
    case 'typst':
      return 'pdf';
    case 'html':
      return 'html';
    case 'markdown':
      return 'md';
    default:
      return 'pdf';
  }
}
