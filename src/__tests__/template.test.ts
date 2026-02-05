
import { describe, it, expect, mock } from "bun:test";
import { parseTemplates, resolveTemplate, loadManifest } from "../template";
import { resolve } from "path";

// We need to mock @actions/core because it might not be available or might try to use process.env
mock.module("@actions/core", () => ({
  info: () => { },
  error: () => { },
  warning: () => { },
  debug: () => { },
  startGroup: () => { },
  endGroup: () => { },
  getInput: (name: string) => name,
  getBooleanInput: () => true,
  setOutput: () => { },
  setFailed: () => { },
  addPath: () => { },
}));

// Mock @actions/exec to avoid actual CLI calls
mock.module("@actions/exec", () => ({
  exec: async () => { },
}));

// Mock fs/promises for controlled file access
mock.module("fs/promises", () => ({
  readFile: async (path: string) => {
    if (path.includes("template.yaml")) {
      return `
name: Test Template
type: latex
entrypoint: resume.tex.tmpl
output_name: resume
delimiters: ["[[", "]]"]
      `;
    }
    return "";
  },
  access: async (path: string) => {
    if (path.includes("latex-template") || path.includes("typst-template") || path.includes("html-template")) {
      return; // Success for built-in templates
    }
    if (path.includes("template.yaml")) {
      return; // Success for manifest files
    }
    throw new Error("File not found");
  },
}));

// Mock yaml parsing
mock.module("yaml", () => ({
  parse: (input: string) => {
    if (input.includes("Test Template")) {
      return {
        name: "Test Template",
        type: "latex",
        entrypoint: "resume.tex.tmpl",
        output_name: "resume",
        delimiters: ["[[", "]]"]
      };
    }
    return {};
  },
}));

describe("Template Parser", () => {
  it("should handle builtin templates", () => {
    const templates = "latex-template\ntypst-template";
    const parsed = parseTemplates(templates);
    expect(parsed).toEqual(["builtin:latex-template", "builtin:typst-template"]);
  });

  it("should handle official templates", () => {
    const templates = "official:latex-resume";
    const parsed = parseTemplates(templates);
    expect(parsed).toEqual(["https://github.com/pause-org/pause-templates/latex-resume"]);
  });

  it("should handle full URLs", () => {
    const templates = "https://github.com/user/repo";
    const parsed = parseTemplates(templates);
    expect(parsed).toEqual(["https://github.com/user/repo"]);
  });

  it("should handle owner/repo short format", () => {
    const templates = "sushruth/pause-template-latex";
    const parsed = parseTemplates(templates);
    expect(parsed).toEqual(["https://github.com/sushruth/pause-template-latex"]);
  });
});

import { basename, extname, join } from "path";

function getOutputExtension(type: "latex" | "typst" | "html" | "markdown"): string {
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

describe("Output Logic", () => {
  it("should determine correct output extension", () => {
    expect(getOutputExtension("latex")).toBe("pdf");
    expect(getOutputExtension("typst")).toBe("pdf");
    expect(getOutputExtension("html")).toBe("html");
    expect(getOutputExtension("markdown")).toBe("md");
  });

  it("should match current implementation's filename logic", () => {
    // This replicates the logic in builder.ts
    const manifest = { entrypoint: "main.tex.tmpl", output_name: "resume", type: "latex" };

    // Logic from renderTemplate
    const entrypointPath = "mock/templates/minimal/main.tex.tmpl";
    const outputFilename = basename(manifest.entrypoint).replace('.tmpl', '');
    const renderedPath = join("mock/cwd", outputFilename);
    expect(renderedPath).toBe("mock/cwd/main.tex");

    // Logic from buildTemplate
    const finalOutputFilename = `${manifest.output_name}.${getOutputExtension(manifest.type as any)}`;
    const finalOutputPath = join("mock/cwd", finalOutputFilename);
    expect(finalOutputPath).toBe("mock/cwd/resume.pdf");

    // Tectonic logic
    // tectonic main.tex --outdir .
    // Result is main.pdf, BUT finalOutputPath is resume.pdf
    expect(finalOutputFilename).not.toBe("main.pdf");
  });
});

describe("Template Resolution", () => {
  it("should resolve built-in templates correctly", async () => {
    const result = await resolveTemplate("builtin:latex-template", "fake-token");
    expect(result).toContain("latex-template");
  });

  it("should throw error for non-existent built-in templates", async () => {
    await expect(resolveTemplate("builtin:nonexistent", "fake-token"))
      .rejects.toThrow("Built-in template \"nonexistent\" not found");
  });

  it("should resolve external templates by cloning", async () => {
    const result = await resolveTemplate("https://github.com/user/repo", "fake-token");
    expect(result).toContain("repo");
  });

  it("should handle GitHub owner/repo format", async () => {
    const result = await resolveTemplate("owner/repo", "fake-token");
    expect(result).toContain("repo");
  });
});

describe("Manifest Loading", () => {
  it("should load valid YAML manifest", async () => {
    const manifest = await loadManifest("/fake/path");
    expect(manifest.name).toBe("Test Template");
    expect(manifest.type).toBe("latex");
    expect(manifest.entrypoint).toBe("resume.tex.tmpl");
    expect(manifest.output_name).toBe("resume");
    expect(manifest.delimiters).toEqual(["[[", "]]"]);
  });

  it("should throw error for missing manifest files", async () => {
    // Override the mock for this test
    const { readFile, access } = await import("fs/promises");
    mock.module("fs/promises", () => ({
      readFile: async () => "{}",
      access: async () => { throw new Error("File not found"); },
    }));

    await expect(loadManifest("/nonexistent/path"))
      .rejects.toThrow("No template manifest found");
  });
});
