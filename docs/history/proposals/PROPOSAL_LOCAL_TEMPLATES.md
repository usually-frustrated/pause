# 📜 Historic: Proposal - Local Template Support

> **Archive Note**: This proposal suggested allowing templates to be stored locally within the user's repository. This feature remains a candidate for future versions but was not included in the initial v1.x stable releases.

---

# Proposal: Local Template Support

## Motivation

Many users want to customize their resume layout but don't want to create a separate "template repository" for it. Allowing the `templates` input to accept a local path (e.g., `./my-resume-style`) makes the action much more flexible and avoids "repository bloat".

## Proposed Usage

```yaml
- uses: usually-frustrated/pause@main
  with:
    templates: |
      ./my-local-template
      minimal
```

## Implementation Plan

### 1. Template Parsing (`src/template.ts`)
- Detect paths starting with `./`, `../`, or `/`.
- Normalize these paths relative to `GITHUB_WORKSPACE`.
- Add a internal `local:` prefix for internal handling, similar to `builtin:`.

### 2. Resolution Logic
- In `resolveTemplate`, if the prefix is `local:`, verify the directory exists.
- Ensure the directory contains a valid `template.yaml`.

### 3. Documentation
- Add a "Tier 3: Local Templates" section to the architecture docs.
- Provide a guide specifically for local-first development in `TEMPLATE_GUIDE.md`.

## Security Considerations
- Ensure paths stay within the workspace boundary (prevent directory traversal).
- Validate the manifest content before execution.
