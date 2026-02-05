# Minimal Professional Template (TLCresume)

Based on the TLCresume LaTeX style by Timmy Chan and gobborg. Clean, professional single-column layout with custom formatting and typography.

## Preview

Professional layout with three-column header, tabular skills section, and tight vertical spacing optimized for content density.

## Features

- Three-column header layout (contact info, name, social links)
- Custom `TLCresume.sty` package for consistent formatting
- Tabular skills section with dashed separators
- Tight `zitemize` environment for compact bullet points
- Small caps section headers
- Custom colors for hyperlinks
- 0.5in margins for maximum content

## Supported Resume Sections

- ✅ Basics (name, contact, location, profiles)
- ✅ Summary/Objective
- ✅ Work Experience (with highlights)
- ✅ Education
- ✅ Skills (rendered as table)
- ✅ Publications

## Usage

```yaml
templates: |
  builtin:latex-minimal
```

Or as shorthand:
```yaml
templates: latex-minimal
```

## Output

Single-page PDF resume compiled with Tectonic.
