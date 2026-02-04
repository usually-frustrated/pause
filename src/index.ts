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
import {
  getChangelog,
  generateReleaseTag,
  createGitHubRelease,
  deployToGitHubPages,
} from "./release";
import { prepareResumeData, parseArtifactNameTemplate } from "./utils";

async function run(): Promise<void> {
  try {
    // 1. Get action inputs
    const inputs: ActionInputs = {
      resumeFile: core.getInput("resume_file", { required: true }),
      templates: core.getInput("templates", { required: true }),
      githubToken: core.getInput("github_token", { required: true }),
      createRelease: core.getBooleanInput("create_release") ?? true,
      releaseTag: core.getInput("release_tag") || undefined,
      changelogSource: (core.getInput("changelog_source") || "commits") as
        | "commits"
        | "file"
        | "manual",
      changelogFile: core.getInput("changelog_file") || undefined,
      changelogText: core.getInput("changelog_text") || undefined,
      deployGithubPages: core.getInput("deploy_github_pages") || "false",
      artifactNameTemplate: core.getInput("artifact_name_template") || undefined,
    };

    core.info("🎬 Starting Pause Action...");
    core.info(`Resume file: ${inputs.resumeFile}`);

    // 2. Load resume.json
    const workspace = process.env.GITHUB_WORKSPACE || process.cwd();
    const resumePath = resolve(workspace, inputs.resumeFile);
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

        // Prepare data (escape based on template type)
        const preparedData = prepareResumeData(resumeData, manifest.type);

        // Render template with Gomplate
        const renderedPath = await renderTemplate(
          templatePath,
          manifest,
          preparedData,
        );
        core.info(`✅ Rendered: ${renderedPath}`);

        // Build output (PDF/HTML)
        const outputPath = await buildTemplate(renderedPath, manifest);
        core.info(`✅ Built: ${outputPath}`);

        results.push({
          template: templateUrl,
          outputPath,
          success: true,
          templateType: manifest.type,
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

    // 7. Create release if enabled
    if (inputs.createRelease && successful.length > 0) {
      core.startGroup("📦 Creating GitHub Release");

      try {
        const octokit = github.getOctokit(inputs.githubToken);
        const { owner, repo } = github.context.repo;

        // Generate release tag
        const releaseTag = generateReleaseTag(inputs.releaseTag);
        core.info(`Release tag: ${releaseTag}`);

        // Generate changelog
        const changelog = await getChangelog(inputs, octokit, owner, repo);
        core.info("Changelog generated");

        // Create release with artifacts
        const artifactPaths = successful.map((r) => r.outputPath);
        const releaseInfo = await createGitHubRelease(
          octokit,
          owner,
          repo,
          releaseTag,
          changelog,
          artifactPaths,
          resumeData,
          inputs.artifactNameTemplate,
        );

        core.setOutput("release_url", releaseInfo.htmlUrl);
        core.setOutput("release_tag", releaseInfo.tag);

        core.info(`✅ Release created: ${releaseInfo.htmlUrl}`);

        // Deploy to GitHub Pages if enabled
        const deployTemplate = inputs.deployGithubPages.toLowerCase();
        if (deployTemplate !== "false" && deployTemplate !== "") {
          core.info(`Checking for GitHub Pages deployment: ${deployTemplate}`);

          // Find the specific result that matches the requested template
          // We check both the template URL/shortcut and the template name if available
          const deployTarget = successful.find(
            (r) =>
              r.template === deployTemplate ||
              r.template === `builtin:${deployTemplate}` ||
              r.template === `github:${deployTemplate}` ||
              r.template.endsWith(`/${deployTemplate}`) ||
              r.templateType === deployTemplate, // Allow 'html' as a shorthand
          );

          if (deployTarget && deployTarget.templateType === "html") {
            core.info(`Deploying ${deployTarget.template} to GitHub Pages...`);
            await deployToGitHubPages(
              octokit,
              owner,
              repo,
              deployTarget.outputPath,
            );
          } else if (deployTarget) {
            core.warning(
              `Cannot deploy ${deployTarget.template} to GitHub Pages: only HTML templates are supported`,
            );
          } else {
            core.warning(
              `GitHub Pages deployment failed: template "${deployTemplate}" was not found or failed to build`,
            );
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        core.warning(`Failed to create release: ${errorMessage}`);
      }

      core.endGroup();
    }

    // 8. Set outputs
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
