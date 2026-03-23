# CLAUDE.md

## Project Overview

**plugin-importer** is a Node.js library that recursively imports a plugin tree in dependency order using topological sorting (via `@hapi/topo`). It handles plugin name normalization, dependency resolution, and circular dependency detection.

## Key Commands

```bash
npm test              # Full suite: linting + type checks + tests with coverage
npm run test:node     # Tests only (with c8 coverage)
npm run check:lint    # ESLint (neostandard)
npm run check:tsc     # TypeScript type checking
npm run check:knip    # Dead code detection
npm run build         # Generate TypeScript declarations from JSDoc
```

## Architecture

- **ESM-only** (`"type": "module"`) — all source is JavaScript with JSDoc type annotations (no `.ts` files)
- **TypeScript declarations** are generated from JSDoc via `declaration.tsconfig.json`
- Entry point: `index.js` / `index.d.ts` re-exports from `lib/`

### Source Files (`lib/`)

| File | Purpose |
|------|---------|
| `load-plugins.js` | Core `loadPlugins()` factory — creates plugin loaders with custom processing |
| `resolve-plugins.js` | `resolvePluginsInOrder()` — topological sort, validation, cycle detection |
| `plain-plugins.js` | `resolvePlainPlugins()` — convenience wrapper for simple use cases |
| `normalize-plugin-name.js` | Plugin name normalization with optional prefix (like eslint-config) |
| `utils.js` | `getExtensionlessBasename()`, `importAbsolutePath()`, type guards |
| `advanced-types.d.ts` | `PluginDefinition` interface (hand-written types) |

### Tests (`test/`)

- Uses **Node.js native test runner** (`node --test`) with `sinon` for mocks
- Test files: `*.spec.js`
- Fixtures in `test-fixtures/` (circular deps, traversal, basic dependency)

## Code Conventions

- **Style**: neostandard via `@voxpelli/eslint-config`
- **Indentation**: 2 spaces, LF line endings (see `.editorconfig`)
- **Types**: JSDoc annotations in `.js` files, not TypeScript source. Type coverage must be ≥99%
- **Error handling**: Use error chains with `cause` property
- **Commits**: Conventional Commits enforced by husky commit-msg hook
- **No package-lock.json** — this is a library (`.npmrc: package-lock=false`)

## CI/CD

GitHub Actions workflows: `nodejs.yml` (Node 20/22/24, ubuntu + windows), `lint.yml`, `compliance.yml`, `ts-internal.yml`. Releases via `release-please`.

## Node Version Support

`^20.15.0 || >=22.2.0`
