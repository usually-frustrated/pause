# Pause > Resume

A GitHub Action that orchestrates resume generation from `resume.json` using templates.

## Features

- **Push-to-Publish**: Commit your `resume.json`, get PDF/HTML outputs automatically
- **Template-Based**: Use community templates or create your own
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
      - 'resume.json'

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
          resume_file: 'resume.json'
          templates: |
            github:pause-org/pause-template-minimal
            github:pause-org/pause-template-academic
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

## Inputs

| Input | Required | Description |
|-------|----------|-------------|
| `resume_file` | Yes | Path to your resume.json file |
| `templates` | Yes | Newline-separated list of template URLs |
| `github_token` | Yes | GitHub token for API access |

## Template Format

Templates are GitHub repositories with:

1. Name starting with `pause-template-`
2. A `template.yaml` manifest:

```yaml
name: "Minimal Resume"
type: "latex"
entrypoint: "main.tex.tmpl"
output_name: "resume"
delimiters: ["[[", "]]"]
```

3. Template files using Gomplate syntax with `[[ ]]` delimiters

## Supported Template Types

- **latex**: Compiled with Tectonic → PDF
- **typst**: Compiled with Typst CLI → PDF  
- **html**: Static HTML output
- **markdown**: Markdown output

## Creating Templates

See the [Template Specification](docs/initial-spec.md#3-the-pause-template-specification) for details.

Example template file (`main.tex.tmpl`):

```latex
\documentclass{article}
\begin{document}
  \section{[[ .basics.name ]]}
  [[ range .work ]]
    \subsection{[[ .name ]]}
  [[ end ]]
\end{document}
```

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

## License

MIT
