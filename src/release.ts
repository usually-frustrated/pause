/**
 * Release management functionality
 * Handles changelog generation, release creation, and GitHub Pages deployment
 */

import * as core from "@actions/core";
import * as github from "@actions/github";
import { readFile } from "fs/promises";
import type { CommitInfo, ReleaseInfo, ActionInputs } from "./types";

/**
 * Generate changelog from git commits since last release
 */
export async function generateChangelogFromCommits(
  octokit: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string,
): Promise<string> {
  try {
    // Get latest release to determine commit range
    let sinceDate: string | undefined;
    let previousTag: string | undefined;
    try {
      const { data: latestRelease } = await octokit.rest.repos.getLatestRelease(
        {
          owner,
          repo,
        },
      );
      sinceDate = latestRelease.created_at;
      previousTag = latestRelease.tag_name;
      core.info(
        `Found latest release: ${latestRelease.tag_name} (${sinceDate})`,
      );
    } catch (error) {
      core.info("No previous releases found, using all commits");
    }

    // Get commits since last release (or all commits if first release)
    const { data: commits } = await octokit.rest.repos.listCommits({
      owner,
      repo,
      since: sinceDate,
      per_page: 100,
    });

    if (commits.length === 0) {
      return "No changes since last release.";
    }

    // Parse commits into structured format
    const commitInfos: CommitInfo[] = commits.map((commit) => ({
      sha: commit.sha.substring(0, 7),
      message: commit.commit.message.split("\n")[0], // First line only
      author: commit.commit.author?.name || "Unknown",
      date: commit.commit.author?.date || "",
    }));

    // Group commits by type (feat, fix, docs, etc.)
    const grouped: Record<string, CommitInfo[]> = {
      features: [],
      fixes: [],
      docs: [],
      other: [],
    };

    for (const commit of commitInfos) {
      const msg = commit.message.toLowerCase();
      if (msg.startsWith("feat:") || msg.startsWith("feature:")) {
        grouped.features.push(commit);
      } else if (msg.startsWith("fix:")) {
        grouped.fixes.push(commit);
      } else if (msg.startsWith("docs:") || msg.startsWith("doc:")) {
        grouped.docs.push(commit);
      } else {
        grouped.other.push(commit);
      }
    }

    // Build markdown changelog
    let changelog = "## What's Changed\n\n";

    if (grouped.features.length > 0) {
      changelog += "### ✨ Features\n\n";
      for (const commit of grouped.features) {
        changelog += `- ${commit.message} (${commit.sha})\n`;
      }
      changelog += "\n";
    }

    if (grouped.fixes.length > 0) {
      changelog += "### 🐛 Bug Fixes\n\n";
      for (const commit of grouped.fixes) {
        changelog += `- ${commit.message} (${commit.sha})\n`;
      }
      changelog += "\n";
    }

    if (grouped.docs.length > 0) {
      changelog += "### 📚 Documentation\n\n";
      for (const commit of grouped.docs) {
        changelog += `- ${commit.message} (${commit.sha})\n`;
      }
      changelog += "\n";
    }

    if (grouped.other.length > 0) {
      changelog += "### 🔧 Other Changes\n\n";
      for (const commit of grouped.other) {
        changelog += `- ${commit.message} (${commit.sha})\n`;
      }
      changelog += "\n";
    }

    changelog += `\n**Full Changelog**: https://github.com/${owner}/${repo}/compare/${previousTag ? previousTag + "..." : ""}HEAD`;

    return changelog;
  } catch (error) {
    core.warning(`Failed to generate changelog from commits: ${error}`);
    return "Resume updated. See commit history for details.";
  }
}

/**
 * Generate changelog from file
 */
export async function generateChangelogFromFile(
  filePath: string,
): Promise<string> {
  try {
    const content = await readFile(filePath, "utf-8");
    return content;
  } catch (error) {
    throw new Error(`Failed to read changelog file ${filePath}: ${error}`);
  }
}

/**
 * Get changelog based on source configuration
 */
export async function getChangelog(
  inputs: ActionInputs,
  octokit: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string,
): Promise<string> {
  switch (inputs.changelogSource) {
    case "commits":
      return await generateChangelogFromCommits(octokit, owner, repo);
    case "file":
      if (!inputs.changelogFile) {
        throw new Error(
          "changelog_file is required when changelog_source is 'file'",
        );
      }
      return await generateChangelogFromFile(inputs.changelogFile);
    case "manual":
      if (!inputs.changelogText) {
        throw new Error(
          "changelog_text is required when changelog_source is 'manual'",
        );
      }
      return inputs.changelogText;
    default:
      return await generateChangelogFromCommits(octokit, owner, repo);
  }
}

/**
 * Generate release tag based on timestamp if not provided
 */
export function generateReleaseTag(providedTag?: string): string {
  if (providedTag) {
    return providedTag;
  }

  // Generate timestamp-based tag: resume-YYYY-MM-DD-HHMMSS
  const now = new Date();
  const timestamp = now
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\..+/, "")
    .replace("T", "-");
  return `resume-${timestamp.substring(0, 15)}`; // resume-YYYYMMDD-HHMMSS
}

/**
 * Create GitHub release with artifacts
 */
export async function createGitHubRelease(
  octokit: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string,
  tag: string,
  changelog: string,
  artifactPaths: string[],
): Promise<ReleaseInfo> {
  core.info(`Creating release ${tag}...`);

  // Create the release
  const { data: release } = await octokit.rest.repos.createRelease({
    owner,
    repo,
    tag_name: tag,
    name: `Resume ${tag}`,
    body: changelog,
    draft: false,
    prerelease: false,
  });

  core.info(`✅ Release created: ${release.html_url}`);

  // Upload artifacts as release assets
  for (const artifactPath of artifactPaths) {
    await uploadReleaseAsset(octokit, owner, repo, release.id, artifactPath);
  }

  return {
    tag: release.tag_name,
    name: release.name || "",
    body: release.body || "",
    htmlUrl: release.html_url,
    uploadUrl: release.upload_url,
  };
}

/**
 * Upload a file as a release asset
 */
async function uploadReleaseAsset(
  octokit: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string,
  releaseId: number,
  filePath: string,
): Promise<void> {
  const fs = await import("fs/promises");
  const path = await import("path");

  const fileName = path.basename(filePath);
  const fileContent = await fs.readFile(filePath);

  core.info(`Uploading ${fileName}...`);

  await octokit.rest.repos.uploadReleaseAsset({
    owner,
    repo,
    release_id: releaseId,
    name: fileName,
    data: fileContent as unknown as string,
  });

  core.info(`✅ Uploaded ${fileName}`);
}

/**
 * Deploy HTML to GitHub Pages
 */
export async function deployToGitHubPages(
  octokit: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string,
  htmlPath: string,
): Promise<void> {
  const fs = await import("fs/promises");
  const path = await import("path");

  core.info("Deploying to GitHub Pages...");

  // Read HTML content
  const htmlContent = await fs.readFile(htmlPath, "utf-8");
  const fileName = path.basename(htmlPath);

  // Get default branch
  const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
  const defaultBranch = repoData.default_branch;

  // Check if gh-pages branch exists
  let ghPagesBranchExists = false;
  try {
    await octokit.rest.repos.getBranch({ owner, repo, branch: "gh-pages" });
    ghPagesBranchExists = true;
  } catch (error) {
    core.info("gh-pages branch does not exist, will create it");
  }

  if (!ghPagesBranchExists) {
    // Create gh-pages branch from default branch
    const { data: ref } = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${defaultBranch}`,
    });

    await octokit.rest.git.createRef({
      owner,
      repo,
      ref: "refs/heads/gh-pages",
      sha: ref.object.sha,
    });

    core.info("✅ Created gh-pages branch");
  }

  // Get the current tree SHA for gh-pages
  const { data: branch } = await octokit.rest.repos.getBranch({
    owner,
    repo,
    branch: "gh-pages",
  });

  // Create blob for HTML file
  const { data: blob } = await octokit.rest.git.createBlob({
    owner,
    repo,
    content: Buffer.from(htmlContent).toString("base64"),
    encoding: "base64",
  });

  // Create tree with index.html
  const { data: tree } = await octokit.rest.git.createTree({
    owner,
    repo,
    base_tree: branch.commit.sha,
    tree: [
      {
        path: "index.html",
        mode: "100644",
        type: "blob",
        sha: blob.sha,
      },
    ],
  });

  // Create commit
  const { data: commit } = await octokit.rest.git.createCommit({
    owner,
    repo,
    message: `Deploy resume from ${fileName}`,
    tree: tree.sha,
    parents: [branch.commit.sha],
  });

  // Update gh-pages branch reference
  await octokit.rest.git.updateRef({
    owner,
    repo,
    ref: "heads/gh-pages",
    sha: commit.sha,
  });

  core.info(`✅ Deployed to https://${owner}.github.io/${repo}/`);

  // Enable GitHub Pages if not already enabled
  try {
    await octokit.rest.repos.createPagesSite({
      owner,
      repo,
      source: {
        branch: "gh-pages",
        path: "/",
      },
    });
    core.info("✅ GitHub Pages enabled");
  } catch (error) {
    // Pages might already be enabled
    core.info("GitHub Pages may already be enabled");
  }
}
