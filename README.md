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
        uses: usually-frustrated/pause@v1
        with:
          resume_file: "resume.json"
          templates: |
            latex-template
            html-template
          github_token: ${{ secrets.GITHUB_TOKEN }}
          create_release: true
          deploy_github_pages: html-template
```

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
uses: usually-frustrated/pause@v1
with:
  artifact_name_template: "my-{template}-resume-{timestamp}"
  # Available variables: {template}, {timestamp}, {sha}
```

**Available Template Variables:**
- `{template}` - Template name (e.g., "latex-template", "html-template")
- `{timestamp}` - Unix timestamp for unique naming
- `{sha}` - Git commit SHA of the current commit

### Version-Independent Templates

This action automatically pulls templates from the `main` branch of template repositories, regardless of which action version you use. This means:

- **Always up-to-date**: Templates get the latest features and fixes
- **Version flexibility**: Use `@v1.0.0`, `@v1`, or `@main` - templates always come from `main`
- **Backward compatibility**: Existing workflows continue to work without changes

If a template repository doesn't have a `main` branch, the action falls back to the default branch.

## Inputs

| Input                 | Required | Description                                                    |
| :-------------------- | :------- | :------------------------------------------------------------- |
| `resume_file`         | **Yes**  | Path to your `resume.json`.                                    |
| `templates`           | **Yes**  | Newline-separated list of templates.                           |
| `github_token`        | **Yes**  | GitHub token for cloning external templates.                   |
| `create_release`      | No       | Create a GitHub release (default: `false`).                    |
| `deploy_github_pages` | No       | Template name to deploy to GitHub Pages (e.g., `html-template`). |
| `artifact_name_template` | No       | Template for artifact filenames (default: `resume-{template}-{timestamp}`). |

## Documentation

- **[Template Guide](docs/TEMPLATE_GUIDE.md)**: How to create your own templates.
- **[Architecture](docs/TEMPLATES.md)**: Deep dive into the template system.
- **[Changelog](CHANGELOG.md)**: Version history and updates.

## Repos That Use This Action

- **[sushruth/resume](https://github.com/sushruth/resume)** - Personal resume using Pause for automated generation

*More repositories coming soon! Want to add yours? Feel free to submit a PR.*

## License

MIT
