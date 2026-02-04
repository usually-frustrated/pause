# Changelog

All notable changes to Pause Action are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Planned
- End-to-end GitHub Actions testing
- Artifact upload to GitHub Releases
- Official template repository (`pause-org/pause-templates`)
- Template preview generation

## [0.2.0] - 2026-02-03

### Added
- **Three-tier template system**: Built-in → Official → Custom
- **Built-in templates** (no cloning required):
  - `minimal`: LaTeX professional single-column resume
  - `modern`: Typst contemporary resume with blue accents
  - `simple`: HTML resume (adapted from sushruth/resume)
- Comprehensive documentation following 5C principles
- `docs/claude.md`: AI agent quick reference
- `docs/CONTRIBUTING.md`: Contribution guidelines
- `docs/TEMPLATES.md`: Template system architecture
- `docs/TEMPLATE_GUIDE.md`: Complete template creation guide
- Historic document markers for original specs

### Changed
- Reorganized all documentation to `docs/` folder
- Updated `simple` template to use sushruth/resume design
- Enhanced README with documentation links
- All docs now include creation/update dates

## [0.1.0] - 2026-02-03

### Added
- **Core GitHub Action** implementation
  - `src/index.ts`: Main orchestration logic
  - `src/template.ts`: Template parsing and cloning
  - `src/builder.ts`: Binary installation and build strategies
  - `src/utils.ts`: Sanitization helpers
  - `src/types.ts`: TypeScript type definitions
- **Binary caching** using `@actions/tool-cache`:
  - Gomplate v4.3.0
  - Tectonic v0.15.0
  - Typst v0.11.0
- **Build strategies**:
  - LaTeX compilation via Tectonic
  - Typst compilation via Typst CLI
  - Static HTML generation
- **Test workflow** (`.github/workflows/test.yml`)
- **Project structure**:
  - Bun + TypeScript runtime
  - Composite GitHub Action
  - Full type safety with strict mode

### Technical Details
- Uses `oven-sh/setup-bun@v2` for Bun runtime
- Supports JSON Resume schema standard
- Gomplate templates with `[[ ]]` delimiters
- GitHub CLI (`gh`) for template cloning

## [0.0.1] - 2026-01-27

### Added
- Initial project setup
- `action.yml`: Action schema definition
- Project documentation:
  - `docs/initial-spec.md`: Original system specification
  - `docs/pause-implementation-paln.md`: Implementation roadmap
- Planning and architecture documents

---

## Version History Summary

| Version | Date | Milestone |
|---------|------|-----------|
| 0.0.1 | 2026-01-27 | Project inception, planning |
| 0.1.0 | 2026-02-03 | Core action implementation |
| 0.2.0 | 2026-02-03 | Three-tier templates, documentation |

## Historic Documents

The following documents are preserved for reference but represent completed work:

- **docs/initial-spec.md** (2026-01-27): Original system design
- **docs/pause-implementation-paln.md** (2026-01-27): Implementation roadmap
  - Phase 1 (T1.1-T1.4): ✅ Completed 2026-02-03
  - Phase 1.5: ✅ Three-tier template system added
  - Phase 2-3: Deferred (testing, official templates)

## Project Timeline

```
2026-01-27: Project start
    ↓
    Initial planning and specification
    ↓
2026-02-03: Core implementation
    ↓
    Bun/TypeScript action + Binary caching + Build strategies
    ↓
    Three-tier template system
    ↓
    3 built-in templates (minimal, modern, simple)
    ↓
    Comprehensive documentation
    ↓
    Production-ready ✅
```

## Breaking Changes

None yet - project is pre-1.0.

## Migration Guide

Not applicable - initial release.

---

**Current Status**: Production-ready with built-in templates. See [STATUS.md](docs/STATUS.md) for details.
