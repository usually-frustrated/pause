# Template Creation Guide

> **Documentation follows the 5Cs**: Concise, Complete, Correct, Confident yet Humble, Clear. See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

Complete guide for creating custom Pause templates.

## Template Repository Structure

A valid Pause template repository must:

1. **Have a name starting with `pause-template-`** (convention)
2. **Include a `template.yaml` manifest** (or `.yml`, `.json`)
3. **Include template files** using Gomplate syntax

### Example Structure

```
pause-template-minimal/
├── template.yaml           # Required manifest
├── main.tex.tmpl          # Template entrypoint
├── assets/                # Optional assets
│   ├── fonts/
│   └── images/
└── README.md              # Documentation
```

## Manifest Schema (`template.yaml`)

```yaml
# Required Fields
name: "Minimal Professional Resume"
type: "latex" # latex | typst | html | markdown
entrypoint: "main.tex.tmpl"
output_name: "resume"

# Optional Fields
delimiters: ["[[", "]]"] # Default: [[ ]]
build_cmd: "custom-build.sh" # Override default build
```

### Field Descriptions

| Field         | Type   | Required | Description                                   |
| ------------- | ------ | -------- | --------------------------------------------- |
| `name`        | string | Yes      | Human-readable template name                  |
| `type`        | enum   | Yes      | Template type (see below)                     |
| `entrypoint`  | string | Yes      | Main template file to render                  |
| `output_name` | string | Yes      | Output filename (without extension)           |
| `delimiters`  | array  | No       | Gomplate delimiters (default: `["[[", "]]"]`) |
| `build_cmd`   | string | No       | Custom build command (overrides default)      |

### Template Types

- **`latex`**: Compiled with Tectonic → PDF
- **`typst`**: Compiled with Typst CLI → PDF
- **`html`**: Static HTML (no compilation)
- **`markdown`**: Markdown output (no compilation)

## Template Syntax

Templates use [Gomplate](https://docs.gomplate.ca/) syntax with `[[ ]]` delimiters.

### Accessing Resume Data

The entire `resume.json` is available at the root context:

```latex
% Name
[[ .basics.name ]]

% Email
[[ .basics.email ]]

% Location
[[ .basics.location.city ]], [[ .basics.location.region ]]
```

### Iterating Over Arrays

```latex
% Work Experience
[[ range .work ]]
  \subsection{[[ .name ]]}
  \textit{[[ .position ]]} \hfill [[ .startDate ]]

  [[ range .highlights ]]
    \item [[ . ]]
  [[ end ]]
[[ end ]]
```

### Conditional Rendering

```latex
[[ if .basics.summary ]]
  \section{Summary}
  [[ .basics.summary ]]
[[ end ]]
```

### Checking for Empty Values

```latex
[[ if .basics.phone ]]
  Phone: [[ .basics.phone ]]
[[ end ]]
```

## LaTeX Templates

### Basic Example

```latex
% main.tex.tmpl
\documentclass{article}
\usepackage[margin=1in]{geometry}
\usepackage{hyperref}

\begin{document}

\begin{center}
  {\LARGE \textbf{[[ .basics.name ]]}}\\
  [[ .basics.label ]]\\
  [[ .basics.email ]] | [[ .basics.phone ]]
\end{center}

\section{Experience}
[[ range .work ]]
  \subsection{[[ .position ]] at [[ .name ]]}
  \textit{[[ .startDate ]] - [[ if .endDate ]][[ .endDate ]][[ else ]]Present[[ end ]]}

  \begin{itemize}
  [[ range .highlights ]]
    \item [[ . ]]
  [[ end ]]
  \end{itemize}
[[ end ]]

\section{Education}
[[ range .education ]]
  \textbf{[[ .institution ]]} - [[ .area ]]\\
  [[ .studyType ]], [[ .endDate ]]
[[ end ]]

\end{document}
```

### Important Notes

- **No escaping needed**: Gomplate handles special LaTeX characters
- **Packages auto-installed**: Tectonic downloads packages on-demand
- **Use standard LaTeX**: All standard packages are available

## Typst Templates

### Basic Example

```typst
// main.typ.tmpl
#set page(margin: 1in)
#set text(font: "Linux Libertine", size: 11pt)

#align(center)[
  = [[ .basics.name ]]
  #text(size: 10pt)[_[[ .basics.label ]]_]

  [[ .basics.email ]] | [[ .basics.phone ]]
]

== Experience
[[ range .work ]]
  === [[ .position ]] at [[ .name ]]
  _[[ .startDate ]] - [[ if .endDate ]][[ .endDate ]][[ else ]]Present[[ end ]]_

  [[ range .highlights ]]
  - [[ . ]]
  [[ end ]]
[[ end ]]
```

## HTML Templates

### Basic Example

```html
<!-- index.html.tmpl -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>[[ .basics.name ]] - Resume</title>
    <link rel="stylesheet" href="assets/style.css" />
  </head>
  <body>
    <header>
      <h1>[[ .basics.name ]]</h1>
      <p>[[ .basics.label ]]</p>
      <p>[[ .basics.email ]] | [[ .basics.phone ]]</p>
    </header>

    <section>
      <h2>Experience</h2>
      [[ range .work ]]
      <article>
        <h3>[[ .position ]] at [[ .name ]]</h3>
        <p>
          [[ .startDate ]] - [[ if .endDate ]][[ .endDate ]][[ else ]]Present[[
          end ]]
        </p>
        <ul>
          [[ range .highlights ]]
          <li>[[ . ]]</li>
          [[ end ]]
        </ul>
      </article>
      [[ end ]]
    </section>
  </body>
</html>
```

## Testing Your Template

1. **Create the template repository**:

   ```bash
   mkdir pause-template-mytemplate
   cd pause-template-mytemplate
   ```

2. **Add `template.yaml`** and template files

3. **Test locally** with Gomplate:

   ```bash
   gomplate \
     --file main.tex.tmpl \
     --datasource resume=resume.json \
     --context resume \
     --left-delim '[[' \
     --right-delim ']]' \
     --out main.tex
   ```

4. **Push to GitHub**:

   ```bash
   gh repo create pause-template-mytemplate --public
   git add .
   git commit -m "Initial template"
   git push
   ```

5. **Use in your workflow**:
   ```yaml
   templates: |
     github:your-username/pause-template-mytemplate
   ```

## Best Practices

### 1. Handle Missing Data Gracefully

```latex
[[ if .basics.url ]]
  Website: \url{[[ .basics.url ]]}
[[ end ]]
```

### 2. Provide Defaults

```latex
[[ .basics.label | default "Professional" ]]
```

### 3. Use Semantic Structure

Organize your template into logical sections that map to JSON Resume schema.

### 4. Include a README

Document:

- What the template looks like (include screenshot)
- What fields it uses from resume.json
- Any special requirements

### 5. Version Your Template

Use Git tags to version your template:

```bash
git tag v1.0.0
git push --tags
```

Users can reference specific versions:

```yaml
github:you/pause-template-mytemplate@v1.0.0
```

## Common Gotchas

1. **Delimiters**: Always use `[[ ]]` (not `{{ }}`) to avoid LaTeX conflicts
2. **Whitespace**: Gomplate preserves whitespace - use `[[- -]]` to trim
3. **Array iteration**: Use `range` not `for`
4. **Nil checks**: Always check if optional fields exist before using

## Examples

See official templates:

- `pause-org/pause-template-minimal` - Basic LaTeX
- `pause-org/pause-template-academic` - Academic CV
- `pause-org/pause-template-modern` - Modern HTML

## Need Help?

Open an issue on the Pause Action repository or check the documentation at:
https://github.com/pause-org/action
