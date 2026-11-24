import { describe, it, expect } from "bun:test";
import { escapeLatex } from "../utils";

describe("escapeLatex", () => {
  it("turns Unicode punctuation the PDF fonts lack into TeX equivalents", () => {
    expect(escapeLatex("scope—designing")).toBe("scope---designing");
    expect(escapeLatex("Epic–Teams")).toBe("Epic--Teams");
    expect(escapeLatex("“quoted” ‘it’s’")).toBe("``quoted'' `it's'");
    expect(escapeLatex("and so on…")).toBe("and so on\\ldots{}");
  });

  it("still escapes LaTeX special characters", () => {
    expect(escapeLatex("50% of R&D_x")).toBe("50\\% of R\\&D\\_x");
  });
});
