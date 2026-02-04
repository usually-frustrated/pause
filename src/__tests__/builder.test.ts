import { describe, it, expect, mock } from "bun:test";
import { installBinaries, renderTemplate, buildTemplate } from "../builder";
import type { TemplateManifest } from "../types";

// Mock @actions/core
mock.module("@actions/core", () => ({
  info: () => { },
  error: () => { },
  warning: () => { },
  debug: () => { },
  startGroup: () => { },
  endGroup: () => { },
  getInput: () => "",
  getBooleanInput: () => false,
  setOutput: () => { },
  setFailed: () => { },
  addPath: () => { },
}));

// Mock @actions/exec
mock.module("@actions/exec", () => ({
  exec: async (command: string, args?: string[]) => {
    // Simulate successful execution
    if (command === "tectonic") {
      return;
    }
    if (command === "typst") {
      return;
    }
  },
}));

// Mock @actions/tool-cache
mock.module("@actions/tool-cache", () => ({
  downloadTool: async () => "/fake/path/tool",
  extractTar: async () => "/fake/path/extracted",
  cacheFile: async () => "/fake/path/cached",
  find: () => "/fake/path/cached",
}));

// Mock fs/promises
mock.module("fs/promises", () => ({
  readFile: async (path: string) => {
    if (path.includes(".tmpl")) {
      return "Hello [[basics.name]]!";
    }
    return "";
  },
  writeFile: async () => { },
  mkdir: async () => { },
  access: async () => { },
  rename: async () => { }, // Mock rename to avoid ENOENT errors
}));

// Mock path and process
mock.module("path", () => ({
  join: (...args: string[]) => args.join("/"),
  basename: (path: string) => path.split("/").pop() || "",
  dirname: (path: string) => path.split("/").slice(0, -1).join("/"),
  resolve: (...args: string[]) => args.join("/"),
  extname: (path: string) => "." + path.split(".").pop(),
}));

// Mock process
mock.module("../utils", () => ({
  prepareResumeData: (data: any) => data,
  parseArtifactNameTemplate: () => "resume.pdf",
}));

const mockManifest: TemplateManifest = {
  name: "Test Template",
  type: "latex",
  entrypoint: "resume.tex.tmpl",
  output_name: "resume",
  delimiters: ["[[", "]]"],
};

describe("Binary Installation", () => {
  it("should install required binaries", async () => {
    const result = installBinaries();
    await expect(result).resolves.toBeUndefined();
  });
});

describe("Template Rendering", () => {
  it("should render LaTeX templates with Gomplate", async () => {
    const result = await renderTemplate(
      "/fake/template/path",
      mockManifest,
      { basics: { name: "John Doe" } }
    );
    
    expect(result).toContain("resume.tex");
  });

  it("should render Typst templates", async () => {
    const typstManifest: TemplateManifest = {
      ...mockManifest,
      type: "typst",
      entrypoint: "resume.typ.tmpl",
    };

    const result = await renderTemplate(
      "/fake/template/path",
      typstManifest,
      { basics: { name: "Jane Doe" } }
    );
    
    expect(result).toContain("resume.typ");
  });

  it("should render HTML templates", async () => {
    const htmlManifest: TemplateManifest = {
      ...mockManifest,
      type: "html",
      entrypoint: "resume.html.tmpl",
    };

    const result = await renderTemplate(
      "/fake/template/path",
      htmlManifest,
      { basics: { name: "Bob Smith" } }
    );
    
    expect(result).toContain("resume.html");
  });
});

describe("Template Building", () => {
  it("should build LaTeX templates with Tectonic", async () => {
    const result = await buildTemplate(
      "/fake/rendered/resume.tex",
      mockManifest
    );
    
    expect(result).toContain("resume.pdf");
  });

  it("should build Typst templates", async () => {
    const typstManifest: TemplateManifest = {
      ...mockManifest,
      type: "typst",
    };

    const result = await buildTemplate(
      "/fake/rendered/resume.typ",
      typstManifest
    );
    
    expect(result).toContain("resume.pdf");
  });

  it("should build HTML templates (no compilation needed)", async () => {
    const htmlManifest: TemplateManifest = {
      ...mockManifest,
      type: "html",
    };

    const result = await buildTemplate(
      "/fake/rendered/resume.html",
      htmlManifest
    );
    
    expect(result).toContain("resume.html");
  });

  it("should build Markdown templates", async () => {
    const mdManifest: TemplateManifest = {
      ...mockManifest,
      type: "markdown",
      entrypoint: "resume.md.tmpl",
    };

    const result = await buildTemplate(
      "/fake/rendered/resume.md",
      mdManifest
    );
    
    expect(result).toContain("resume.md");
  });
});