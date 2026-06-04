# Contributing to Iris

Thank you for your interest in contributing to Iris! This guide will help you get started with development.

## Development Setup

### Prerequisites

- **Node.js**: v20+
- **Bun**: Latest version (preferred) or npm
- **Chrome/Chromium**: For testing the extension

### Quick Start

```bash
# Clone the repository
git clone https://github.com/iris-agent/iris.git
cd iris/extension

# Install dependencies
bun install

# Start development server
bun run dev
```

This will open Chrome with the extension loaded. Changes to code will auto-reload.

### Building

```bash
# Production build
bun run build

# Create .zip for distribution
bun run zip
```

## Project Structure

```
extension/
├── entrypoints/         # WXT entry points
│   ├── background.ts    # Service worker
│   ├── sidepanel/       # React UI
│   ├── content.ts       # Content scripts
│   └── newtab/          # New tab override
├── core/                # Core functionality
│   ├── agent/           # LLM orchestration
│   ├── cdp/             # Chrome DevTools Protocol
│   ├── tools/           # Tool definitions
│   └── types.ts         # Shared types
├── lib/                 # Libraries
│   ├── memory.ts        # Persistent memory
│   ├── soul.ts          # AI personality config
│   └── storage.ts       # Storage utilities
└── ui/                  # React components
    └── components/      # UI components
```

## Coding Standards

### TypeScript

- Use strict TypeScript mode
- Prefer explicit types over `any`
- Use Zod for runtime validation (see `core/tools/` for examples)

### React

- Functional components with hooks
- Use TypeScript types, not PropTypes
- Follow existing component patterns in `ui/components/`

### Tools

New tools are defined using `defineTool`:

```typescript
import { z } from 'zod'
import { defineTool } from './framework'

export const my_tool = defineTool({
  name: 'my_tool',
  description: 'What the tool does',
  input: z.object({
    param: z.string().describe('Parameter description'),
  }),
  handler: async (args, ctx, response) => {
    // Tool implementation
    response.text('Result message')
  },
})
```

### Git Conventions

- **Branch naming**: `feature/description` or `fix/description`
- **Commits**: Use clear, concise commit messages
- **PRs**: Include description of changes and testing steps

## Testing

### Manual Testing

1. Run `bun run dev` to start the development server
2. Make changes in your IDE
3. Test in the automatically opened Chrome window
4. Check the console for errors

### Type Checking

```bash
bun run compile
```

This runs TypeScript type checking without emitting files.

## Submitting Changes

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `bun run compile` to check types
5. Run `bun run build` to verify the build
6. Submit a pull request

## Code Review

When submitting a PR, include:

- **Description**: What the change does and why
- **Testing**: How you tested the change
- **Screenshots**: If UI changes are involved

## Getting Help

- **Issues**: Open a GitHub issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Security**: See [SECURITY.md](SECURITY.md) for vulnerability reporting

---

*Your contributions are appreciated!*