# Built-in Templates

Pause includes three production-ready templates out of the box.

## Available Templates

### 📄 Minimal (LaTeX)

**Type:** `latex` → PDF  
**Usage:** `minimal` or `builtin:minimal`

Clean, single-column resume with classic typography. Perfect for traditional industries.

**Features:**
- Single column layout
- Professional serif font
- Clear section headers
- Compact formatting
- ATS-friendly

[View Template →](minimal/)

---

### ✨ Modern (Typst)

**Type:** `typst` → PDF  
**Usage:** `modern` or `builtin:modern`

Contemporary resume with blue accent colors and modern typography.

**Features:**
- Blue accent color scheme
- Clean section headers
- Fast Typst compilation
- Professional spacing
- Modern appearance

[View Template →](modern/)

---

### 🌐 Simple (HTML)

**Type:** `html` → Web  
**Usage:** `simple` or `builtin:simple`

Responsive HTML resume perfect for web deployment.

**Features:**
- Fully responsive
- Purple gradient header
- Print-optimized CSS
- No external dependencies
- GitHub Pages ready

[View Template →](simple/)

---

## Quick Start

Use any template in your workflow:

```yaml
- uses: usually-frustrated/pause@main
  with:
    resume_file: 'resume.json'
    templates: |
      minimal
      modern
      simple
    github_token: ${{ secrets.GITHUB_TOKEN }}
```

## Template Structure

Each built-in template includes:

```
template-name/
├── template.yaml       # Manifest
├── main.{ext}.tmpl    # Template file
└── README.md          # Documentation
```

## Creating Your Own

Want to create a custom template? See the [Template Guide](../TEMPLATE_GUIDE.md).

The built-in templates serve as excellent starting points for customization.
