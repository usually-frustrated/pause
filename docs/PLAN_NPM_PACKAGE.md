# Plan: NPM Package for Pause Template Authors

> **Status**: Planning  
> **Target**: `@usually-frustrated/pause-sdk` (tentative)

## Objectives

To make it easier for community members to build and maintain high-quality templates for Pause, we should provide a SDK/library that centralizes common logic, types, and testing utilities.

## Proposed Features

### 1. Type Definitions

Currently, authors have to reference documentation or guess the `resume.json` schema transformations. An npm package would provide:
- `ResumeData`: Fully typed interface for the data passed to templates.
- `TemplateManifest`: Interface for `template.yaml`.
- `TemplateType`: Enum/types for supported output formats.

### 2. Validation Utilities

A CLI tool or library function to validate a template directory:
- Check if `template.yaml` exists and is valid.
- Verify the `entrypoint` file exists.
- Dry-run rendering with mock data.

### 3. Escape Tools

Currently, `Pause` handles escaping (LaTeX vs HTML vs Typst) internally. We could export these helpers so authors can test their templates locally using the same logic.

### 4. Local Development Server

Wait for a local mock/runner that:
- Watches `resume.json` and template files.
- Auto-compiles on change.
- Serves a preview of the rendered artifact.

## Implementation Steps

### Phase 1: Core Types (Low Effort)
1. Extract `src/types.ts` into a new package.
2. Publish to npm.
3. Update `pause` action to use this package.

### Phase 2: Schema & Validation (Medium Effort)
1. Add JSON Schema for `template.yaml`.
2. Implement a `validate-template` CLI command.

### Phase 3: Developer Experience (High Effort)
1. Create a `create-pause-template` starter kit.
2. Implement the local watch/preview runner.

## Questions to Resolve
- Should we use a monorepo structure (using Bun workspaces) in this repository?
- Should the SDK be written in TypeScript or pure JS for maximum compatibility?
- How do we handle heavy dependencies like `tectonic` or `typst` in the SDK's local preview? (Likely require them to be installed on the host system).
