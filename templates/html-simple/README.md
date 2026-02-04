# Simple Resume Template

A clean, professional HTML resume template adapted from [sushruth/resume](https://github.com/sushruth/resume).

## Preview

Clean, print-friendly layout with three-column header and well-organized sections.

## Features

- **Clean Layout**: Professional three-column header with contact info
- **Print-Optimized**: Designed for both screen and print
- **Responsive**: Works on mobile, tablet, and desktop
- **No Dependencies**: Pure HTML/CSS, no external libraries
- **ATS-Friendly**: Simple structure, easy to parse
- **Complete Sections**: Supports all JSON Resume schema fields

## Design Philosophy

This template follows a classic resume design:

- Three-column header (contact | name | social)
- Clean section headers with horizontal rules
- Compact formatting for maximum information density
- Professional typography with good readability
- Dashed borders for skills section

## Supported Resume Sections

- ✅ **Basics** (name, contact, location, profiles)
- ✅ **Objective/Summary**
- ✅ **Work Experience** (with location, highlights, summary)
- ✅ **Education** (degree, institution, dates)
- ✅ **Skills** (table format with categories)
- ✅ **Publications** (name, publisher, date, link)

usage:

```yaml
templates: |
  html-simple
```

Or explicit:

```yaml
templates: |
  builtin:html-simple
```

## Output

Single HTML file optimized for:

- **Direct viewing** in browser
- **Printing** to PDF (File → Print → Save as PDF)
- **GitHub Pages** deployment
- **Static hosting** on any web server

## Template Structure

The template combines all sections into a single HTML file with:

- Inline CSS for portability
- Semantic HTML structure
- Mobile-responsive media queries
- Print-specific styles

## Customization

Edit the `<style>` section to customize:

- **Colors**: Link color (`#0066cc`)
- **Fonts**: Font family (`Helvetica Neue`)
- **Spacing**: Margins and padding
- **Layout**: Header column widths

## Credits

Based on the default template from [sushruth/resume](https://github.com/sushruth/resume/tree/main/infrastructure/templates/default).
Adapted to work with Gomplate and the Pause Action paradigm.
