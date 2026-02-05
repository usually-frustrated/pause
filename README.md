<div align="center">
<img src="logo.svg" width="24" height="24" alt="Pause Logo" />

# Pause

**Resume orchestration for GitHub Actions**

</div>

---

A GitHub Action that orchestrates resume generation from `resume.json` using LaTeX, Typst, or HTML templates.

## Features

- **Push-to-Publish**: Commit `resume.json`, get automated PDF/HTML artifacts.
- **Three-Tier Templates**: Built-in, official, or any custom GitHub repository.
- **Fast & Modern**: Powered by Bun, Tectonic, and Typst for rapid compilation.
- **Integrated**: Automatic GitHub Releases and Pages deployment support.

## Quick Start

Create `.github/workflows/resume.yml`:

```yaml
name: Build Resume
on:
  push:
    branches: [main]
    paths: ["resume.json"]

jobs:
  build:
    runs-on: ubuntu-latest
    permissions: { contents: write }
    steps:
      - uses: actions/checkout@v4
      - name: Generate Resume
        uses: usually-frustrated/pause@v2
        with:
          resume_file: "resume.json"
          templates: |
            latex-template
            html-template
          github_token: ${{ secrets.GITHUB_TOKEN }}
          create_release: true
          deploy_github_pages: html-template
```

Your `resume.json` should follow the [JSON Resume schema](https://jsonresume.org/schema/).

## Template System

Pause uses a three-tier discovery system:

1.  **Built-in**: `latex-template` (LaTeX), `typst-template` (Typst), `html-template` (HTML).
2.  **Official**: `official:template-name` (from `pause-org/pause-templates`).
3.  **Custom**: `github:user/repo` or any standard repository path (e.g., `user/repo`).

### Example

```yaml
templates: |
  latex-template                   # Built-in (LaTeX)
  html-template                    # Built-in (HTML)
  official:academic-cv             # Official
  github:you/pause-template-custom  # Custom
```

### Artifact Naming

Use `artifact_name_template` to customize output filenames:

```yaml
uses: usually-frustrated/pause@v2
with:
  artifact_name_template: "John Doe {MMM} {yyyy} Resume"
  # Available variables: {name}, {yyyy}, {MMM}
```

**Available Template Variables:**
- `{name}` - Name from resume JSON (e.g., "John Doe")
- `{yyyy}` - Current year (4 digits, e.g., "2024")
- `{MMM}` - Current month (3-letter abbreviation, e.g., "Jan", "Feb")

### Version-Independent Templates

This action automatically pulls templates from the `main` branch of template repositories, regardless of which action version you use. This means:

- **Always up-to-date**: Templates get the latest features and fixes
- **Version flexibility**: Use `@v1.0.0`, `@v1`, or `@main` - templates always come from `main`
- **Backward compatibility**: Existing workflows continue to work without changes

If a template repository doesn't have a `main` branch, the action falls back to the default branch.

## Inputs

| Input                    | Required | Default    | Description                                                                                      |
| :----------------------- | :------- | :--------- | :----------------------------------------------------------------------------------------------- |
| `resume_file`            | **Yes**  | -          | Path to your `resume.json` (must follow [JSON Resume schema](https://jsonresume.org/schema/)).  |
| `templates`              | **Yes**  | -          | Newline-separated list of templates.                                                             |
| `github_token`           | **Yes**  | -          | GitHub token for API access (use `${{ secrets.GITHUB_TOKEN }}`).                                 |
| `create_release`         | No       | `false`    | Create GitHub release with generated PDFs/HTML as assets.                                        |
| `release_tag`            | No       | Auto       | Custom release tag (e.g., `v1.0.0`). Auto-generates timestamp-based tag if not provided.         |
| `changelog_source`       | No       | `commits`  | Changelog source: `commits` (git history), `file` (read from file), or `manual` (inline text).   |
| `changelog_file`         | No       | -          | Path to changelog file when `changelog_source: file`.                                            |
| `changelog_text`         | No       | -          | Inline changelog text when `changelog_source: manual`.                                           |
| `deploy_github_pages`    | No       | `false`    | Deploy HTML template to GitHub Pages (e.g., `html-template`). Only works with HTML templates.    |
| `artifact_name_template` | No       | `resume`   | Template for artifact filenames. Variables: `{name}`, `{yyyy}`, `{MMM}`.                         |

## Outputs

| Output          | Description                                                      |
| :-------------- | :--------------------------------------------------------------- |
| `artifacts`     | Comma-separated paths to generated files (e.g., `resume.pdf`).  |
| `success_count` | Number of templates that built successfully.                     |
| `failure_count` | Number of templates that failed to build.                        |
| `release_url`   | URL of created GitHub release (if `create_release: true`).       |
| `release_tag`   | Tag name of created release (if `create_release: true`).         |

### Using Outputs

```yaml
- name: Generate Resume
  id: resume
  uses: usually-frustrated/pause@v2
  with:
    resume_file: resume.json
    templates: latex-template

- name: Use outputs
  run: |
    echo "Generated: ${{ steps.resume.outputs.artifacts }}"
    echo "Release: ${{ steps.resume.outputs.release_url }}"
```

## Release Creation

When `create_release: true`, Pause automatically:

1. **Generates changelog** from git commits (grouped by type: feat/fix/docs) or your custom source
2. **Creates GitHub release** with timestamp-based tag (e.g., `resume-20260205-143022`)
3. **Uploads all artifacts** (PDFs, HTML) as release assets
4. **Publishes release URL** as action output

### Changelog Sources

```yaml
# Option 1: From git commits (default)
changelog_source: commits

# Option 2: From file
changelog_source: file
changelog_file: CHANGELOG.md

# Option 3: Inline text
changelog_source: manual
changelog_text: |
  ## What's New
  - Updated experience section
  - Fixed formatting
```

## Breaking Changes in v2

⚠️ **Action now fails if ANY template fails to compile** (previously only failed if ALL templates failed). This ensures you're immediately notified of build errors.

## Troubleshooting

**Template compilation fails:**
- Verify your `resume.json` follows [JSON Resume schema](https://jsonresume.org/schema/)
- Check action logs for specific LaTeX/Typst errors
- Test with built-in templates first to isolate issues

**Missing outputs:**
- Ensure `create_release: true` if you need `release_url`/`release_tag` outputs
- Check `failure_count` output - failed templates won't generate artifacts

**GitHub Pages deployment fails:**
- Only HTML templates can deploy to Pages
- Requires `deploy_github_pages: html-template` (or your HTML template name)
- Needs repository Pages enabled in Settings

## Documentation

- **[Template Guide](docs/TEMPLATE_GUIDE.md)**: How to create your own templates.
- **[Architecture](docs/TEMPLATES.md)**: Deep dive into the template system.
- **[Changelog](CHANGELOG.md)**: Version history and updates.
- **[JSON Resume Schema](https://jsonresume.org/schema/)**: Resume data format.

## Repos That Use This Action

- **[sushruth/resume](https://github.com/sushruth/resume)** - Personal resume using Pause for automated generation

*More repositories coming soon! Want to add yours? Feel free to submit a PR.*

## License

MIT
