# Template System Architecture

> **Last Updated**: 2026-02-03  
> **Documentation follows the 5Cs**: Concise, Complete, Correct, Confident yet Humble, Clear. See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

Pause uses a **three-tier template discovery system** for maximum flexibility.

## The Three Tiers

```
┌─────────────────────────────────────────────────────────────┐
│  Tier 1: Built-in Templates (usually-frustrated/pause)      │
│  ✓ Always available                                        │
│  ✓ No cloning required                                     │
│  ✓ Fast execution                                          │
│                                                             │
│  Usage: latex-minimal, typst-modern, html-simple
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Tier 2: Official Templates (usually-frustrated/pause-templates)    │
│  ✓ Curated by Pause team                                   │
│  ✓ Community contributions                                 │
│  ✓ Version controlled                                      │
│                                                             │
│  Usage: official:template-name                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Tier 3: Custom Templates (Any GitHub Repo)                │
│  ✓ User-created                                            │
│  ✓ Full customization                                      │
│  ✓ Private repos supported                                 │
│                                                             │
│  Usage: github:owner/repo or owner/repo                    │
└─────────────────────────────────────────────────────────────┘
```

## Built-in Templates (Tier 1)

### 📄 Latex Minimal

**File:** `templates/latex-minimal/`  
**Type:** LaTeX → PDF  
**Style:** Professional, single-column, classic typography

```yaml
templates: latex-minimal
```

**Best for:** Traditional industries, ATS systems, clean presentation

---

### ✨ Typst Modern

**File:** `templates/typst-modern/`  
**Type:** Typst → PDF  
**Style:** Contemporary, blue accents, modern spacing

```yaml
templates: typst-modern
```

**Best for:** Tech companies, creative roles, modern industries

---

### 🌐 HTML Simple

**File:** `templates/html-simple/`  
**Type:** HTML → Web  
**Style:** Responsive, gradient header, print-friendly

```yaml
templates: html-simple
```

**Best for:** GitHub Pages, portfolios, web deployment

## Official Templates (Tier 2)

_Coming soon in `usually-frustrated/pause-templates` repository_

The official template repository will include:

- **academic-cv**: Multi-page academic CV with publications
- **creative-portfolio**: Portfolio-style resume with projects
- **executive**: Executive resume with achievements focus
- **tech-modern**: Tech-focused with skills emphasis
- **two-column**: Compact two-column layout

Usage:

```yaml
templates: |
  official:academic-cv
  official:creative-portfolio
```

## Custom Templates (Tier 3)

### Creating a Custom Template

1. **Create a repository** (e.g., `pause-template-custom`)
2. **Add `template.yaml`**:
   ```yaml
   name: "My Custom Template"
   type: "latex"
   entrypoint: "main.tex.tmpl"
   output_name: "resume"
   ```
3. **Add template file** using `[[ ]]` delimiters
4. **Use in workflow**:
   ```yaml
   templates: github:your-username/pause-template-custom
   ```

See [TEMPLATE_GUIDE.md](TEMPLATE_GUIDE.md) for the complete guide.

## Template Resolution Logic

```typescript
// The action parses template references in order:

"latex-minimal"              → builtin:latex-minimal
"typst-modern"               → builtin:typst-modern
"html-simple"                → builtin:html-simple
"builtin:latex-minimal"      → builtin:latex-minimal (explicit)

"official:academic-cv"       → github.com/usually-frustrated/pause-templates/academic-cv

"github:user/repo"           → github.com/user/repo
"https://github.com/..."     → Direct URL
"user/repo"                  → github.com/user/repo (default)
```

## Template Manifest

Every template (all tiers) requires a `template.yaml`:

```yaml
# Required
name: "Template Name"
type: "latex" | "typst" | "html" | "markdown"
entrypoint: "main.tex.tmpl"
output_name: "resume"

# Optional
delimiters: ["[[", "]]"]    # Default
description: "Template description"
build_cmd: "custom-build.sh"  # Override default
```

## Mixing Templates

Use all three tiers in a single workflow:

```yaml
templates: |
  latex-minimal                    # Tier 1: Built-in
  typst-modern                     # Tier 1: Built-in
  official:academic-cv             # Tier 2: Official
  github:you/pause-template-fancy  # Tier 3: Custom
```

The action will generate one output per template.

## Benefits of This Architecture

### Tier 1 (Built-in)

- ✅ Zero setup - works immediately
- ✅ Fast - no cloning
- ✅ Tested - part of action repo
- ✅ Versioned - tied to action version

### Tier 2 (Official)

- ✅ Curated quality
- ✅ Community vetted
- ✅ Well documented
- ✅ Regular updates

### Tier 3 (Custom)

- ✅ Full control
- ✅ Private templates
- ✅ Experiment freely
- ✅ Share with others

## Examples

### Minimal Setup

```yaml
templates: latex-minimal
```

### Multi-Format

```yaml
templates: |
  latex-minimal # PDF via LaTeX
  typst-modern  # PDF via Typst
  html-simple   # HTML for web
```

### Advanced Mix

```yaml
templates: |
  latex-minimal                  # Quick PDF
  official:academic-cv           # Academic version
  github:me/pause-template-cv    # Personal custom
```

## Next Steps

1. **Use built-in templates** - Start with `latex-minimal`, `typst-modern`, or `html-simple`
2. **Explore official templates** - Check `usually-frustrated/pause-templates` (coming soon)
3. **Create custom templates** - Follow the [Template Guide](TEMPLATE_GUIDE.md)
4. **Share your templates** - Publish with `pause-template-*` naming

---

**Documentation:**

- [Template Creation Guide](TEMPLATE_GUIDE.md)
- [Built-in Templates Catalog](templates/README.md)
- [Main README](README.md)
