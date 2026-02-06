# 📜 Historic: Proposal - Descriptive Template Names

> **Archive Note**: This proposal was **ACCEPTED** and implemented. Built-in templates were renamed to include their engine/type (e.g., `latex-template`, `typst-template`) to improve clarity for users.

---

# Proposal: Descriptive Template Names

## Motivation

Current template names (`minimal`, `modern`, `simple`) are ambiguous. Users have to check documentation to know that `minimal` uses LaTeX and `modern` uses Typst. Prepends or suffixes clarify the technology stack immediately.

## Proposed Naming

| Current Name | Proposed Name | Engine | Output |
| :--- | :--- | :--- | :--- |
| `minimal` | `latex-minimal` | LaTeX (Tectonic) | PDF |
| `modern` | `typst-modern` | Typst | PDF |
| `simple` | `html-simple` | HTML | Web/HTML |

## Implementation Plan

### 1. File System Changes
- Rename `templates/minimal` to `templates/latex-minimal`
- Rename `templates/modern` to `templates/typst-modern`
- Rename `templates/simple` to `templates/html-simple`

### 2. Code Changes (`src/template.ts`)
- Update `builtinTemplates` array.
- Update mapping logic to support the new names.
- Update error messages to list the new valid identifiers.

### 3. Documentation Updates
- Update `README.md` with new examples.
- Update `docs/TEMPLATES.md` architecture diagrams.
- Update `templates/README.md` and individual template `README.md` files.
- Update `action.yml` input descriptions.

## Backward Compatibility
We should keep the old names as aliases for at least one version to avoid breaking existing workflows, or clearly communicate this as a breaking change (v2.0.0).
