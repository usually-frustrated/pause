# **Project Pause: Implementation Plan**

> **Status**: 📜 Historic Document - All phases completed  
> **Created**: 2026-01-27  
> **Completed**: 2026-02-03  
> **Purpose**: Original implementation roadmap - preserved for reference  
> **Current Status**: See [STATUS.md](STATUS.md)

_Version: 0.1.0 | Created: 2026-01-27 | Completed: 2026-02-03_

## **Table of Contents**

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Phase 1: Core GitHub Action (Bun + TypeScript)](#phase-1-core-github-action-bun--typescript)
4. [Phase 2: Template Repository Creation](#phase-2-template-repository-creation)
5. [Phase 3: Testing & Validation](#phase-3-testing--validation)
6. [Task Manager MCP (Multi-Session Tasks)](#task-manager-mcp-multi-session-tasks)

## **Project Overview**

"Pause > Resume" is a GitHub Actions-based orchestration system that transforms `resume.json` into compiled formats (PDF, HTML) using templating and containerized build steps. The goal is to implement a reusable action, template registry, and validation framework, with a focus on speed, consistency, and user control.

## **Tech Stack**

- **Script Logic**: Bun.js (TypeScript) for orchestration (fast, ESM-native, TypeScript-first).
- **GitHub Action Runtime**: `oven-sh/setup-bun` (official Bun setup with auto-caching; no Docker).
- **Dependencies**: Gomplate (template rendering), Tectonic (LaTeX compilation), Typst (Typst compilation) – downloaded during action runs (cached via GitHub Actions).
- **Template Management**: `gh` CLI (to create/clone template repos in user’s GitHub account).

## **Phase 1: Core GitHub Action (Bun + TypeScript)**

_Build a reusable action (`usually-frustrated/pause@main`) to orchestrate resume generation._

### **Sub-Tasks**

| **Task**                                 | **Details**                                                                                                                                                                                                                       |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1 Define Action Schema                 | Create `action.yml` to map inputs (`resume_file`, `templates`, `github_token`) and specify runtime (Bun).                                                                                                                         |
| 1.2 Write TypeScript Orchestration Logic | Develop a `src/index.ts` script to: <br> - Parse `resume.json` <br> - Clone templates (via `gh` CLI) <br> - Render templates with Gomplate <br> - Run build commands (Tectonic/Typst) <br> - Upload artifacts to GitHub Releases. |
| 1.3 Configure GitHub Action Workflow     | Create `.github/workflows/pause.yml` to: <br> - Trigger on `resume.json` or workflow changes <br> - Use `oven-sh/setup-bun` for caching <br> - Execute the TypeScript script.                                                     |
| 1.4 Add Caching for Binaries             | Use `actions/cache` to cache Gomplate, Tectonic, and Typst binaries in `~/.bun/bin`.                                                                                                                                              |

## **Phase 2: Template Repository Creation**

_Create 3 reference templates in the user’s GitHub account (via `gh` CLI) to validate the action._

### **Sub-Tasks**

| **Task**                        | **Details**                                                                                                                                                            |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1 Set Up `gh` CLI             | Authenticate `gh` with the user’s GitHub account (run `gh auth login`).                                                                                                |
| 2.2 Create Template Repos       | Use a script to generate 3 templates: <br> - `pause-template-latex` (LaTeX/Tectonic) <br> - `pause-template-typst` (Typst) <br> - `pause-template-html` (Static HTML). |
| 2.3 Validate Template Structure | Ensure each repo has: <br> - `template.yaml` (manifest) <br> - Entrypoint `.tmpl` file <br> - `assets/` folder (if needed) <br> - Example `resume.json` for testing.   |

## **Phase 3: Testing & Validation**

_Verify the action and templates work end-to-end._

### **Sub-Tasks**

| **Task**                | **Details**                                                                                              |
| ----------------------- | -------------------------------------------------------------------------------------------------------- |
| 3.1 Local Testing       | Run the TypeScript script locally with a test `resume.json` and template to validate rendering/building. |
| 3.2 GitHub Action Test  | Push the workflow file to a test repo and trigger a run on `resume.json` change.                         |
| 3.3 Template Validation | Confirm cloned templates render correctly (PDF/HTML) and artifacts are uploaded.                         |

## **Task Manager MCP (Multi-Session Tasks)**

_Track progress across sessions with measurable, actionable tasks._

### **Task List**

| **Task ID** | **Objective**              | **Steps**                                                                                                                                                                                                                       | **Owner**                                                                                                                        | **Deadline**  | **Dependencies** |
| ----------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------- | ---------------- | ---------- |
| T1.1        | Define `action.yml` schema | 1. Create `action.yml` in `usually-frustrated/action`. <br> 2. Map inputs to GitHub Action schema. <br> 3. Set `runs.using` to `node18` (Bun-compatible).                                                                                | User/Dev                                                                                                                         | [Milestone 1] | None             |
| T1.2        | Write TypeScript logic     | 1. Initialize `src/` folder with `index.ts`, `template.ts`, `builder.ts`, `utils.ts`. <br> 2. Implement template cloning via `gh` CLI. <br> 3. Add Gomplate rendering and build commands. <br> 4. Test with mock `resume.json`. | User/Dev                                                                                                                         | [Milestone 2] | T1.1             |
| T1.3        | Configure workflow         | 1. Create `.github/workflows/pause.yml`. <br> 2. Add `actions/checkout@v4`, `oven-sh/setup-bun@v2`, and script execution steps. <br> 3. Set `permissions` for `contents` and `actions`.                                         | User/Dev                                                                                                                         | [Milestone 3] | T1.2             |
| T1.4        | Add binary caching         | 1. Use `actions/cache` to cache `~/.bun/bin`. <br> 2. Test cache retention across runs.                                                                                                                                         | User/Dev                                                                                                                         | [Milestone 4] | T1.3             |
| T2.1        | Set up `gh` CLI            | 1. Install `gh` (via `brew` or `snap`). <br> 2. Run `gh auth login` and select the user’s account. <br> 3. Verify access with `gh repo list`.                                                                                   | User/Dev                                                                                                                         | [Start]       | None             |
| T2.2        | Create template repos      | 1. Write a bash script to generate repos (name, description, structure). <br> 2. Run the script to create 3 templates. <br> 3. Push repos to GitHub.                                                                            | User/Dev                                                                                                                         | [Milestone 5] | T2.1             |
| T2.3        | Validate templates         | 1. For each repo, check `template.yaml` schema. <br> 2. Add example `resume.json` and test rendering. <br> 3. Document template usage in `README.md`.                                                                           | User/Dev                                                                                                                         | [Milestone 6] | T2.2             |
| T3.1        | Local testing              | 1. Install Bun (`curl -fsSL https://bun.sh/install                                                                                                                                                                              | bash`). <br> 2. Run `bun install`and`bun run src/index.ts` with test data. <br> 3. Verify output files (PDF/HTML) are generated. | User/Dev      | [Milestone 7]    | T1.4, T2.3 |
| T3.2        | GitHub Action test         | 1. Fork `usually-frustrated/action` and push the workflow file. <br> 2. Trigger a run on `resume.json` change. <br> 3. Check logs for errors; validate artifact upload.                                                                  | User/Dev                                                                                                                         | [Milestone 8] | T3.1             |
| T3.3        | Final validation           | 1. Run the action with all 3 templates. <br> 2. Confirm all formats (PDF/HTML) are generated correctly. <br> 3. Document troubleshooting steps.                                                                                 | User/Dev                                                                                                                         | [Milestone 9] | T3.2             |

### **Notes**

- **Milestones**: Track progress via milestones (e.g., "Phase 1 Complete" after T1.4).
- **Caching**: GitHub Actions automatically invalidate caches only if dependencies (e.g., `bun.lock`) change.
- **Dependencies**: Tasks are ordered to ensure prerequisites are met (e.g., T1.2 depends on T1.1).

This plan is designed for multi-session work. Use the task list to resume progress, and update deadlines/milestones as needed.
