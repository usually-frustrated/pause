#!/usr/bin/env bun
/**
 * Pause Action - Main Entry Point
 * Orchestrates resume generation from resume.json using templates
 */

import * as core from "@actions/core";
import * as github from "@actions/github";
import { readFile } from "fs/promises";
import { resolve } from "path";
import type { ActionInputs, ResumeData, BuildResult } from "./types";
import { parseTemplates, resolveTemplate, loadManifest } from "./template";
import { installBinaries, renderTemplate, buildTemplate } from "./builder";

async function run(): Promise<void> {
  try {
    // 1. Get action inputs
    const inputs: ActionInputs = {
      resumeFile: core.getInput("resume_file", { required: true }),
      templates: core.getInput("templates", { required: true }),
      githubToken: core.getInput("github_token", { required: true }),
    };

    core.info("🎬 Starting Pause Action...");
    core.info(`Resume file: ${inputs.resumeFile}`);

    // 2. Load resume.json
    const resumePath = resolve(process.cwd(), inputs.resumeFile);
    const resumeContent = await readFile(resumePath, "utf-8");
    const resumeData: ResumeData = JSON.parse(resumeContent);

    core.info(`✅ Loaded resume for: ${resumeData.basics?.name || "Unknown"}`);

    // 3. Install required binaries (Gomplate, Tectonic, Typst)
    core.startGroup("📦 Installing build tools");
    await installBinaries();
    core.endGroup();

    // 4. Parse template list
    const templateUrls = parseTemplates(inputs.templates);
    core.info(`📋 Found ${templateUrls.length} template(s)`);

    // 5. Process each template
    const results: BuildResult[] = [];

    for (const templateUrl of templateUrls) {
      core.startGroup(`🔨 Processing template: ${templateUrl}`);

      try {
        // Resolve template (built-in or clone external)
        const templatePath = await resolveTemplate(
          templateUrl,
          inputs.githubToken,
        );
        core.info(`✅ Template path: ${templatePath}`);

        // Load manifest
        const manifest = await loadManifest(templatePath);
        core.info(`Template: ${manifest.name} (${manifest.type})`);

        // Render template with Gomplate
        const renderedPath = await renderTemplate(
          templatePath,
          manifest,
          resumeData,
        );
        core.info(`✅ Rendered: ${renderedPath}`);

        // Build output (PDF/HTML)
        const outputPath = await buildTemplate(renderedPath, manifest);
        core.info(`✅ Built: ${outputPath}`);

        results.push({
          template: templateUrl,
          outputPath,
          success: true,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        core.error(`❌ Failed to process ${templateUrl}: ${errorMessage}`);
        results.push({
          template: templateUrl,
          outputPath: "",
          success: false,
          error: errorMessage,
        });
      }

      core.endGroup();
    }

    // 6. Summary
    core.startGroup("📊 Build Summary");
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    core.info(`✅ Successful: ${successful.length}`);
    core.info(`❌ Failed: ${failed.length}`);

    if (successful.length > 0) {
      core.info("\nGenerated artifacts:");
      successful.forEach((r) => core.info(`  - ${r.outputPath}`));
    }

    core.endGroup();

    // 7. Set outputs
    core.setOutput("artifacts", successful.map((r) => r.outputPath).join(","));
    core.setOutput("success_count", successful.length);
    core.setOutput("failure_count", failed.length);

    if (failed.length > 0 && successful.length === 0) {
      core.setFailed("All templates failed to build");
    } else if (failed.length > 0) {
      core.warning(`${failed.length} template(s) failed to build`);
    }

    core.info("🎉 Pause Action completed!");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    core.setFailed(`Action failed: ${errorMessage}`);
  }
}

// Run the action
run();
