# Plan: Template Resolution Simplification

> **Status**: Draft / Planned  
> **Created**: 2026-02-06  
> **Last Updated**: 2026-02-06  
> **Goal**: Simplify template architecture by removing "Tiers" and "Official" concepts, adding Local support, and optimizing Remote fetching.

## 1. Objective

Refactor the template resolution system to support three clear sources without arbitrary "tiers" or "official" designations:
1.  **Standard** (Built-in): Shipped with the action.
2.  **Local** (Filesystem): Located in the user's repository.
3.  **Remote** (Git): Located in any remote git repository, with sparse-checkout support.

## 2. Proposed Syntax

| Source | Syntax | Example | Resolution |
| :--- | :--- | :--- | :--- |
| **Standard** | `name` | `latex-template` | Resolves to `templates/latex-template` inside the action directory. |
| **Local** | `./path` | `./my-resume` | Resolves to `$GITHUB_WORKSPACE/my-resume`. |
| **Remote** | `git:uri/path` | `git:github.com/user/repo/folder` | Clones `user/repo` (sparse checkout of `folder`) to temp dir. |

## 3. Implementation Steps

### Phase 1: Code Refactoring (`src/template.ts`)

- [ ] **Update `parseTemplates`**:
    - Remove `official:` logic.
    - Remove `builtin:` prefix logic (just match the known names directly).
    - Detect `./` for local paths.
    - Support `git:` prefix for remote operations.

- [ ] **Update `resolveTemplate`**:
    - **Case 1 (Standard)**: If input matches `latex-template`, `typst-template`, etc., return the internal path.
    - **Case 2 (Local)**: If starts with `./` or `/`, resolve relative to `GITHUB_WORKSPACE`. Validate existence.
    - **Case 3 (Remote)**: If starts with `git:` (or `github:`/`http` for compat), call `cloneTemplate`.

- [ ] **Enhance `cloneTemplate`**:
    - Parse the URI to separate **Repo URL** from **Subdirectory Path**.
    - *Current*: `gh repo clone` (fetches everything).
    - *New Strategy*:
        1. `mkdir temp_dir && cd temp_dir`
        2. `git init`
        3. `git remote add origin <repo_url>`
        4. `git sparse-checkout set <subdirectory_path>` (if path exists)
        5. `git pull origin main --depth 1`

### Phase 2: Documentation Overhaul

- [ ] **Rewrite `docs/TEMPLATES.md`**:
    - Remove "Three Tier" diagrams.
    - Remove "Official Templates" section.
    - Document the new 3-way syntax (`standard`, `local`, `remote`).
    - Explain Sparse Checkout benefits (faster builds for monorepos).

- [ ] **Update `docs/TEMPLATE_GUIDE.md`**:
    - Add section on "Local Development" using the `./` syntax.

- [ ] **Update `action.yml`**:
    - Update input description to reflect new syntax.

## 4. Migration Strategy

- **Backward Compatibility**:
    - `builtin:` prefix: Support silently (strip it) or deprecate.
    - `official:` prefix: **Breaking change**. Treat as generic remote or remove support? *Decision: Remove support, as no official repos exist yet.*
    - `github:` prefix: Treat as alias for `git:github.com/...`.

## 5. Maintenance Instructions

- **When starting work**: Change Status to "In Progress".
- **When completing a step**: Mark checkbox as `[x]`.
- **When finished**: Move this file to `docs/history/historic-plan-template-simplification.md`.
