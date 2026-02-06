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

  // Download and install all binaries in parallel
  await Promise.all(binaries.map(async (binary) => {
    const cachedPath = tc.find(binary.name, binary.version);

    if (cachedPath) {
      core.info(`✅ ${binary.name} v${binary.version} (cached)`);
      core.addPath(cachedPath);
      return;
    }

    core.info(`📥 Downloading ${binary.name} v${binary.version}...`);
    const downloadPath = await tc.downloadTool(binary.url);

    let toolPath: string;

    if (binary.extractDir) {
      // Extract archive
      if (binary.url.endsWith('.tar.gz')) {
        const extractPath = await tc.extractTar(downloadPath);
        toolPath = join(extractPath, binary.extractDir);
      } else if (binary.url.endsWith('.tar.xz')) {
        const extractPath = await tc.extractTar(downloadPath, undefined, 'x');
        toolPath = join(extractPath, binary.extractDir);
      } else {
        throw new Error(`Unsupported archive format: ${binary.url}`);
      }
    } else {
      // Single binary file
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
  }));

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

  // Create a unique temporary directory for this specific build
  const buildId = Math.random().toString(36).substring(2, 10);
  const tempBuildDir = join(process.env.RUNNER_TEMP || '/tmp', `pause-build-${buildId}`);
  await mkdir(tempBuildDir, { recursive: true });
  core.debug(`Created temp build directory: ${tempBuildDir}`);

  // Determine output filename
  const outputFilename = basename(manifest.entrypoint).replace('.tmpl', '');
  const outputPath = join(tempBuildDir, outputFilename);

  // Create data file for Gomplate
  const dataPath = join(tempBuildDir, '.resume-data.json');
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

  // Copy any .sty files from template directory to the temp build directory for LaTeX compilation
  if (manifest.type === 'latex') {
    const fs = await import('fs/promises');
    try {
      const templateFiles = await fs.readdir(templatePath);
      for (const file of templateFiles) {
        if (file.endsWith('.sty')) {
          const srcPath = join(templatePath, file);
          const destPath = join(tempBuildDir, file);
          await fs.copyFile(srcPath, destPath);
          core.info(`Copied ${file} to build directory`);
        }
      }
    } catch (error) {
      core.warning(`Failed to copy .sty files: ${error}`);
    }
  }

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
  const buildDir = dirname(renderedPath);
  const outputFilename = `${manifest.output_name}.${getOutputExtension(manifest.type)}`;
  const finalOutputPath = join(OUTPUT_DIR, outputFilename);
  const intermediateOutputPath = join(buildDir, outputFilename);

  if (manifest.build_cmd) {
    // Custom build command
    core.info(`Running custom build command in ${buildDir}: ${manifest.build_cmd}`);
    await exec.exec('sh', ['-c', manifest.build_cmd], { cwd: buildDir });
    
    // Move to final destination
    const fs = await import('fs/promises');
    await fs.rename(intermediateOutputPath, finalOutputPath);
    return finalOutputPath;
  }

  // Use default build strategy based on type
  switch (manifest.type) {
    case 'latex':
      await buildLatex(renderedPath, intermediateOutputPath);
      break;

    case 'typst':
      await buildTypst(renderedPath, intermediateOutputPath);
      break;

    case 'html':
    case 'markdown':
      // renderedPath is already the HTML/MD file in buildDir
      if (renderedPath !== intermediateOutputPath) {
        const fs = await import('fs/promises');
        await fs.rename(renderedPath, intermediateOutputPath);
      }
      break;

    default:
      throw new Error(`Unsupported template type: ${manifest.type}`);
  }

  // Move the final artifact from buildDir to OUTPUT_DIR
  core.info(`Moving artifact: ${intermediateOutputPath} -> ${finalOutputPath}`);
  const fs = await import('fs/promises');
  try {
    // Try rename first (faster, works on same filesystem)
    await fs.rename(intermediateOutputPath, finalOutputPath);
  } catch (error) {
    // Fallback to copy + unlink for cross-device moves
    core.debug(`Rename failed (possibly cross-device), falling back to copy: ${error}`);
    await fs.copyFile(intermediateOutputPath, finalOutputPath);
    await fs.unlink(intermediateOutputPath);
  }

  return finalOutputPath;
}

/**
 * Build LaTeX using Tectonic
 */
async function buildLatex(inputPath: string, outputPath: string): Promise<void> {
  const buildDir = dirname(inputPath);
  core.info(`Building LaTeX with Tectonic: ${inputPath} -> ${outputPath}`);

  try {
    // Tectonic automatically handles package installation
    await exec.exec('tectonic', [
      inputPath,
      '--outdir', buildDir
    ]);
  } catch (error) {
    core.error(`Tectonic failed with error: ${error}`);
    
    // Show the LaTeX file content for debugging
    const fs = await import('fs/promises');
    try {
      const latexContent = await fs.readFile(inputPath, 'utf-8');
      core.info(`LaTeX file content (first 1000 chars):`);
      core.info(latexContent.substring(0, 1000));
    } catch (readError) {
      core.error(`Could not read LaTeX file: ${readError}`);
    }
    
    throw error;
  }

  // Tectonic output is always based on the input filename
  const inputBaseName = basename(inputPath).replace(extname(inputPath), '');
  const tectonicOutput = join(buildDir, `${inputBaseName}.pdf`);
  
  if (tectonicOutput !== outputPath) {
    core.debug(`Renaming Tectonic output: ${tectonicOutput} -> ${outputPath}`);
    const fs = await import('fs/promises');
    await fs.rename(tectonicOutput, outputPath);
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
