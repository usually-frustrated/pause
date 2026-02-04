
import { describe, it, expect, mock } from "bun:test";
import { parseTemplates } from "../template";

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

describe("Template Parser", () => {
  it("should handle builtin templates", () => {
    const templates = "minimal\nmodern";
    const parsed = parseTemplates(templates);
    expect(parsed).toEqual(["builtin:minimal", "builtin:modern"]);
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
