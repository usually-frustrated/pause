# Pause > Resume

A GitHub Action that orchestrates resume generation from `resume.json` using templates.

## Features

- **Push-to-Publish**: Commit your `resume.json`, get PDF/HTML outputs automatically
- **Three-Tier Templates**: Built-in, official, and custom templates
- **Multi-Format**: Supports LaTeX, Typst, HTML, and Markdown
- **Fast Builds**: Uses Tectonic (not full TeX Live) and Bun runtime
- **Cached Binaries**: GitHub Actions caching for faster runs

## Quick Start

### 1. Add a workflow to your repository

Create `.github/workflows/resume.yml`:

```yaml
name: Build Resume

on:
  push:
    branches: [main]
    paths:
      - "resume.json"

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: write

    steps:
      - uses: actions/checkout@v4

      - name: Generate Resume
        uses: pause-org/action@v1
        with:
          resume_file: "resume.json"
          templates: |
            minimal
            modern
            simple
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

### 2. Create your resume.json

Follow the [JSON Resume](https://jsonresume.org/schema/) standard:

```json
{
  "basics": {
    "name": "John Doe",
    "label": "Software Engineer",
    "email": "john@example.com"
  },
  "work": [],
  "education": [],
  "skills": []
}
```

### 3. Push and watch the magic happen!

Your resume will be built and artifacts uploaded automatically.

## Template System

Pause supports a **three-tier template discovery system**:

### 🏠 Tier 1: Built-in Templates (This Repo)

Always available, no cloning needed. Just use the template name:

```yaml
templates: |
  minimal      # or builtin:minimal
  modern       # or builtin:modern
  simple       # or builtin:simple
```

**Available Built-in Templates:**

| Name      | Type  | Description                                        |
| --------- | ----- | -------------------------------------------------- |
| `minimal` | LaTeX | Clean single-column resume with classic typography |
| `modern`  | Typst | Contemporary layout with blue accents              |
| `simple`  | HTML  | Responsive web resume with gradient header         |

### 🌟 Tier 2: Official Templates (pause-org/pause-templates)

Curated templates maintained by the Pause team and community:

```yaml
templates: |
  official:academic-cv
  official:creative-portfolio
```

### 🎨 Tier 3: Custom Templates (Any GitHub Repo)

Use any template from GitHub:

```yaml
templates: |
  github:username/pause-template-custom
  https://github.com/username/pause-template-fancy
  username/pause-template-minimal  # Defaults to GitHub
```

### Mix and Match

Use all three tiers together:

```yaml
templates: |
  minimal                          # Built-in
  official:academic-cv              # Official
  github:you/pause-template-custom  # Custom
```

## Inputs

| Input          | Required | Description                                     |
| -------------- | -------- | ----------------------------------------------- |
| `resume_file`  | Yes      | Path to your resume.json file                   |
| `templates`    | Yes      | Newline-separated list of templates (see above) |
| `github_token` | Yes      | GitHub token for API access                     |

## Creating Custom Templates

Templates are GitHub repositories with:

1. **Name** starting with `pause-template-*` (convention)
2. **A `template.yaml` manifest**:

```yaml
name: "Minimal Resume"
type: "latex"
entrypoint: "main.tex.tmpl"
output_name: "resume"
delimiters: ["[[", "]]"]
```

3. **Template files** using Gomplate syntax with `[[ ]]` delimiters

### Supported Template Types

- **latex**: Compiled with Tectonic → PDF
- **typst**: Compiled with Typst CLI → PDF
- **html**: Static HTML output
- **markdown**: Markdown output

### Example Template

See [Template Creation Guide](docs/TEMPLATE_GUIDE.md) for complete details.

```latex
% main.tex.tmpl
\documentclass{article}
\begin{document}
  \section{[[ .basics.name ]]}
  [[ range .work ]]
    \subsection{[[ .name ]]} - [[ .position ]]
  [[ end ]]
\end{document}
```

## Built-in Templates

Explore the built-in templates in the [`templates/`](templates/) directory:

- [`templates/minimal/`](templates/minimal/) - LaTeX minimal resume
- [`templates/modern/`](templates/modern/) - Typst modern resume
- [`templates/simple/`](templates/simple/) - HTML web resume

Each template includes a README with preview and usage details.

## Development

Built with:

- **Runtime**: Bun + TypeScript
- **Templating**: Gomplate
- **Build Tools**: Tectonic, Typst CLI

### Local Testing

```bash
bun install
bun run src/index.ts
```

### Project Structure

```
pause/
├── templates/          # Built-in templates
│   ├── minimal/       # LaTeX template
│   ├── modern/        # Typst template
│   └── simple/        # HTML template
├── src/               # TypeScript source
│   ├── index.ts       # Main orchestrator
│   ├── template.ts    # Template resolution
│   ├── builder.ts     # Build strategies
│   └── utils.ts       # Helper functions
└── action.yml         # GitHub Action definition
```

## Documentation

> All documentation follows the **5C Principles**: Concise, Complete, Correct, Confident yet Humble, Clear.

- **[Template System Architecture](docs/TEMPLATES.md)** - Three-tier template system overview
- **[Template Creation Guide](docs/TEMPLATE_GUIDE.md)** - Complete guide for creating custom templates
- **[Project Status](docs/STATUS.md)** - Current progress and roadmap
- **[Implementation Plan](docs/pause-implementation-plan.md)** - Original implementation roadmap
- **[Project Specification](docs/initial-spec.md)** - System architecture and design
- **[Claude Context](docs/claude.md)** - Concise context for AI agents
- **[Contributing Guidelines](docs/CONTRIBUTING.md)** - Code and documentation standards

## License

MIT
