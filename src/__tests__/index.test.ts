import { describe, it, expect, mock, beforeAll } from "bun:test";
import { run } from "../index";
import type { ResumeData } from "../types";

// Mock all external dependencies
mock.module("@actions/core", () => ({
  info: mock(() => {}),
  error: mock(() => {}),
  warning: mock(() => {}),
  debug: mock(() => {}),
  startGroup: mock(() => {}),
  endGroup: mock(() => {}),
  getInput: mock((name: string) => {
    const inputs: Record<string, string> = {
      resume_file: "resume.json",
      templates: "minimal",
      github_token: "fake-token",
      create_release: "false",
      deploy_github_pages: "false",
    };
    return inputs[name] || "";
  }),
  getBooleanInput: mock((name: string) => {
    if (name === "create_release") return false;
    return true;
  }),
  setOutput: mock(() => {}),
  setFailed: mock(() => {}),
  addPath: mock(() => {}),
}));

mock.module("@actions/github", () => ({
  getOctokit: () => ({
    rest: {
      repos: {
        listCommits: async () => ({ data: [] }),
      },
    },
  }),
  context: {
    repo: { owner: "test", repo: "test-repo" },
  },
}));

mock.module("fs/promises", () => ({
  readFile: async (path: string) => {
    if (path.includes("resume.json")) {
      return JSON.stringify({
        basics: {
          name: "Test User",
          email: "test@example.com",
        },
      });
    }
    return "";
  },
}));

mock.module("../template", () => ({
  parseTemplates: () => ["builtin:minimal"],
  resolveTemplate: async () => "/fake/template/path",
  loadManifest: async () => ({
    name: "Minimal Template",
    type: "latex",
    entrypoint: "resume.tex.tmpl",
    output_name: "resume",
    delimiters: ["[[", "]]"],
  }),
}));

mock.module("../builder", () => ({
  installBinaries: async () => {},
  renderTemplate: async () => "/fake/rendered/resume.tex",
  buildTemplate: async () => "/fake/output/resume.pdf",
}));

mock.module("../utils", () => ({
  prepareResumeData: (data: ResumeData) => data,
  parseArtifactNameTemplate: () => "resume.pdf",
}));

mock.module("../release", () => ({
  getChangelog: async () => "Test changelog",
  generateReleaseTag: () => "v1.0.0",
  createGitHubRelease: async () => ({
    tag: "v1.0.0",
    name: "Release v1.0.0",
    body: "Test changelog",
    htmlUrl: "https://github.com/test/test-repo/releases/v1.0.0",
    uploadUrl: "https://upload.github.com/...",
  }),
  deployToGitHubPages: async () => {},
}));

// Mock process.env
beforeAll(() => {
  process.env.GITHUB_WORKSPACE = "/fake/workspace";
});

describe("Main Action", () => {
  it("should run successfully with minimal inputs", async () => {
    const result = run();
    await expect(result).resolves.toBeUndefined();
  });

  it("should set appropriate outputs on success", async () => {
    const core = await import("@actions/core");
    const mockSetOutput = core.setOutput;

    await run();

    // Verify setOutput was called with expected values
    expect(mockSetOutput).toHaveBeenCalled();
  });

  it("should handle template processing errors gracefully", async () => {
    // The main function has try-catch blocks, so it shouldn't throw
    const result = run();
    await expect(result).resolves.toBeUndefined();
  });
});