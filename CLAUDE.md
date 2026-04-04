# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A React frontend application for a work report generator, built with Mantine UI framework and Vite. The frontend code is located in the `FE` directory.

## Development Commands

All commands should be run from the `FE` directory:

```bash
# Development
yarn dev              # Start dev server

# Build
yarn build            # TypeScript check + Vite build
yarn preview          # Preview production build locally

# Testing
yarn vitest           # Run tests once
yarn vitest:watch     # Run tests in watch mode
yarn test             # Full CI suite: typecheck + prettier + lint + vitest + build

# Code Quality
yarn typecheck        # TypeScript type checking
yarn lint             # ESLint + Stylelint
yarn eslint           # ESLint only
yarn stylelint        # Stylelint for CSS
yarn prettier:write   # Format all files

# Storybook
yarn storybook        # Start storybook dev server (port 6006)
yarn storybook:build  # Build static storybook
```

## Requirements

- Node.js v22.11.0 (specified in `.nvmrc`)
- Yarn 4.9.2 (package manager)

## Architecture

**Entry Point Flow**: `src/main.tsx` → `src/App.tsx` → `src/Router.tsx`

**Key Structure**:
- `src/pages/*.page.tsx` - Page components (e.g., HomePage)
- `src/components/*` - Reusable UI components
- `src/theme.ts` - Mantine theme configuration
- `test-utils/` - Custom render helper for tests (wraps components with MantineProvider)

**Path Aliases** (configured in tsconfig.json):
- `@/*` maps to `./src/*`
- `@test-utils` maps to `./test-utils`

## Component Patterns

Each component typically includes:
- `ComponentName.tsx` - Main component file
- `ComponentName.module.css` - CSS styles
- `ComponentName.test.tsx` - Vitest tests
- `ComponentName.story.tsx` - Storybook story

## Testing

Tests use Vitest with React Testing Library. Import the custom render from `@test-utils` which wraps components with MantineProvider:

```tsx
import { render, screen } from '@test-utils';
```

The vitest setup (`vitest.setup.mjs`) mocks `matchMedia` and `ResizeObserver` required by Mantine components.

## Import Order

Imports are auto-sorted by prettier-plugin-sort-imports. Order:
1. CSS imports (`.styles.css`)
2. Framework imports (react, react-router-dom)
3. Built-in Node modules
4. Third-party modules
5. Mantine packages (`@mantine/*`)
6. Path aliases (`@/*`)
7. Relative imports
8. CSS module imports at end