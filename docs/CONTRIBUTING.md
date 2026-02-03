# Contributing to Pause

> **Last Updated**: 2026-02-03  
> **Purpose**: Guidelines for code and documentation contributions

## Documentation Principles: The 5Cs

All documentation in this project follows the **5C Principles**:

1. **Concise** - Respect the reader's time. Every word earns its place.
2. **Complete** - Provide all necessary information. No critical gaps.
3. **Correct** - Accuracy first. Verify examples work.
4. **Confident yet Humble** - Be assertive about what works, practical about trade-offs.
5. **Clear** - Simple language. Scannable structure. Obvious next steps.

### Examples

**❌ Violates 5Cs** (verbose, vague, passive):

```
It might be possible to potentially use the template system in various ways,
depending on your specific needs and requirements. You could possibly try
using built-in templates, or maybe consider creating custom ones if that
seems appropriate for your use case.
```

**✅ Follows 5Cs** (concise, complete, confident, clear):

```
Use built-in templates for immediate results or create custom templates for
full control. See docs/TEMPLATE_GUIDE.md for template creation.
```

## Code Contributions

### Before You Start

1. Read `docs/claude.md` for quick context
2. Run `bun install` and `bun run typecheck`
3. Check existing issues/PRs for similar work

### Development Workflow

```bash
# Install dependencies
bun install

# Type check
bun run typecheck

# Run tests (when available)
bun test

# Test action locally
bun run src/index.ts
```

### Pull Request Guidelines

**Commit Messages**:

- First line: imperative mood, <72 chars
- Body: explain why, not what (code shows what)
- Reference issues: `Fixes #123`

**Example**:

```
Add Typst v0.12 support

Upgrade to Typst v0.12 for improved table handling and better
font support. Maintains backward compatibility with v0.11.

Fixes #42
```

**PR Description**:

- What changed and why
- Testing performed
- Breaking changes (if any)
- Documentation updated

### Code Style

- TypeScript strict mode
- ESM imports
- Explicit types (avoid `any`)
- Descriptive variable names
- Comments explain _why_, not _what_

**Good**:

```typescript
// Use tool-cache for faster subsequent runs
const cachedPath = tc.find(binary.name, binary.version);
```

**Bad**:

```typescript
// Check if cached
const cachedPath = tc.find(binary.name, binary.version);
```

## Template Contributions

### Built-in Templates

Built-in templates have high standards:

- Production-ready design
- Complete JSON Resume support
- Mobile responsive (HTML)
- Print-optimized
- Comprehensive README

Submit built-in templates via PR to `/templates/`.

### Custom Templates

Create custom templates in your own repo:

1. Name: `pause-template-*`
2. Include `template.yaml`
3. Test with example `resume.json`
4. Document in README

Share on discussions for community visibility.

## Documentation Contributions

### Writing Style

- **Active voice**: "Action processes templates" not "Templates are processed"
- **Present tense**: "Template uses Gomplate" not "Template will use"
- **Second person**: "You create" not "Users create"
- **Be specific**: "3 templates" not "several templates"

### Structure

- **Headers**: Clear hierarchy (H1 > H2 > H3)
- **Lists**: Parallel structure
- **Code blocks**: Always specify language
- **Links**: Descriptive text, not "click here"

### Adding Documentation

1. Follow 5C principles
2. Add to appropriate section
3. Update README links if needed
4. Test all examples
5. Proofread for typos

## Questions?

- **Quick questions**: Open a discussion
- **Bug reports**: Open an issue
- **Feature ideas**: Start with discussion, then issue

## License

By contributing, you agree your contributions will be licensed under MIT.

---

**Thank you for contributing!** Every improvement makes resume generation better for everyone.
