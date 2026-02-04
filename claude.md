# Claude Context: Pause Action

> **Last Updated**: 2026-02-03  
> **Purpose**: Concise technical context for AI agents  
> **Quick Context**: GitHub Action that transforms `resume.json` → multiple formats (PDF/HTML) using templates. Built with Bun/TypeScript. Three-tier template system: built-in → official → custom.

## Project Essence

**What**: Resume generation pipeline as GitHub Action with auto-release  
**How**: Gomplate templates + Tectonic/Typst/HTML builders + GitHub Releases  
**Why**: One data file → multiple professional outputs (push-to-publish with changelog)

## Architecture (5 Minutes)

```
resume.json (JSON Resume standard)
    ↓
Action (Bun/TypeScript)
    ↓
Template Resolution (3 tiers)
    ↓
Gomplate Rendering ([[ ]] syntax)
    ↓
Build Strategy (Tectonic/Typst/static)
    ↓
Artifacts (PDF/HTML)
    ↓
GitHub Release (automatic, with changelog)
    ↓
[Optional] GitHub Pages (single HTML)
```

## Three-Tier Template System

| Tier        | Syntax                        | Location                    | Clone? |
| ----------- | ----------------------------- | --------------------------- | ------ |
| 1. Built-in | `minimal`, `modern`, `simple` | `/templates/*`              | No     |
| 2. Official | `official:name`               | `pause-org/pause-templates` | Yes    |
| 3. Custom   | `github:user/repo`            | Any GitHub repo             | Yes    |

## Key Files (What They Do)

```
src/
├── index.ts        # Main orchestrator, processes templates, creates releases
├── template.ts     # 3-tier resolution, manifest parsing
├── builder.ts      # Binary install, Gomplate, build strategies
├── release.ts      # Changelog generation, GitHub releases, Pages deployment
├── utils.ts        # Sanitization (LaTeX/HTML/Typst escaping)
└── types.ts        # TypeScript type definitions

templates/
├── minimal/        # LaTeX single-column
├── modern/         # Typst with blue accents
└── simple/         # HTML (from sushruth/resume)

action.yml          # Composite action, uses oven-sh/setup-bun
```

## How It Works (Runtime)

1. **Parse** templates input → resolve tier
2. **Install** binaries (Gomplate, Tectonic, Typst) with caching
3. **Clone** external templates OR use built-in path
4. **Load** `template.yaml` manifest
5. **Render** `.tmpl` files with Gomplate
6. **Build** via Tectonic/Typst/static
7. **Generate** changelog from commits (or file/manual)
8. **Create** GitHub release with artifacts
9. **Deploy** to GitHub Pages (if single HTML template + enabled)

## Template Manifest

```yaml
name: "Template Name"
type: latex|typst|html|markdown
entrypoint: "main.tex.tmpl"
output_name: "resume"
delimiters: ["[[", "]]"] # Avoid LaTeX {} conflicts
```

## Gomplate Syntax

```
[[ .basics.name ]]                    # Access data
[[ range .work ]] ... [[ end ]]      # Loop
[[ if .basics.summary ]] ... [[ end ]] # Conditional
[[ .keywords | strings.Join ", " ]]  # Pipes
```

## Tech Stack

- **Runtime**: Bun (fast, TypeScript-first, ESM-native)
- **Templating**: Gomplate v4.3.0
- **LaTeX**: Tectonic v0.15.0 (Rust, auto-downloads packages)
- **Typst**: Typst CLI v0.11.0
- **Action**: Composite (not Docker, for speed)
- **Caching**: `@actions/tool-cache` for binaries

## Current Status

✅ **Complete**: Core action, 3 built-in templates, 3-tier system, auto-release, GitHub Pages  
⏳ **Pending**: End-to-end testing, official template repo

## Common Tasks

**Add built-in template**:

1. Create `templates/name/`
2. Add `template.yaml` + `.tmpl` file
3. Update `parseTemplates()` in `template.ts`

**Modify template resolution**:

- Edit `src/template.ts` → `parseTemplates()` and `resolveTemplate()`

**Add build strategy**:

- Edit `src/builder.ts` → add case in `buildTemplate()`

**Test locally**:

```bash
bun install
bun run typecheck
bun run src/index.ts
```

## Data Flow Example

```yaml
# User workflow
templates: minimal
create_release: true  # default

# Parsed to
"builtin:minimal"

# Resolved to
/action/templates/minimal

# Manifest loaded
{type: "latex", entrypoint: "main.tex.tmpl"}

# Rendered with Gomplate
main.tex (injected with resume.json data)

# Built with Tectonic
resume.pdf

# Release created
Tag: resume-20260203-143022
Assets: resume.pdf
Changelog: Generated from commits
URL: https://github.com/user/repo/releases/tag/resume-20260203-143022
```

## Important Conventions

- **Delimiters**: Always `[[ ]]` (not `{{ }}`) to avoid LaTeX conflicts
- **Sanitization**: Use utils.ts functions for special chars
- **Template naming**: `pause-template-*` for custom repos
- **Manifest location**: Root of template repo
- **Binary caching**: By version via tool-cache
- **Type safety**: Full TypeScript with strict mode

## Dependencies

```json
{
  "@actions/core": "GitHub Actions helpers",
  "@actions/exec": "Command execution",
  "@actions/tool-cache": "Binary caching",
  "@actions/artifact": "Artifact upload",
  "@actions/github": "GitHub API (releases, repos)",
  "yaml": "Manifest parsing"
}
```

## Release Features

**Automatic Release Creation** (default: enabled):

- Auto-generates timestamp-based tags: `resume-YYYYMMDD-HHMMSS`
- Custom tags supported via `release_tag` input
- Uploads all generated artifacts (PDF/HTML) as release assets

**Changelog Generation** (3 sources):

1. `commits` (default): Parses git history, groups by type (feat/fix/docs)
2. `file`: Reads from user-provided file path
3. `manual`: Uses provided text directly

**GitHub Pages Deployment** (opt-in):

- Requires `deploy_github_pages: true`
- Only works with single HTML template output
- Deploys to `https://<username>.github.io/<repo>/`
- Creates/updates `gh-pages` branch automatically

## Quick Reference

- JSON Resume schema: https://jsonresume.org/schema/
- Gomplate docs: https://docs.gomplate.ca/
- Built-in templates: `/templates/*/README.md`
- Template guide: `docs/TEMPLATE_GUIDE.md`

## When Working on This Project

1. **Type check first**: `bun run typecheck`
2. **Check built-in templates**: They're in `/templates`, not cloned
3. **Gomplate syntax**: Use `strings.*`, `cond`, `printf` functions
4. **Test workflows**: Use `.github/workflows/test.yml` as reference
5. **Binary paths**: Cached in `RUNNER_TOOL_CACHE` or `/tmp/pause-bin`

---

**Remember**: The action is production-ready with built-in templates. Users can start immediately without creating any custom templates.
