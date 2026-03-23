# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**plugin-importer** is a Node.js library that recursively imports a plugin tree in dependency order using topological sorting (via `@hapi/topo`). It handles plugin name normalization, dependency resolution, and circular dependency detection.

## Key Commands

```bash
npm test                                    # Full suite: linting + type checks + tests with coverage
npm run test:node                           # Tests only (with c8 coverage)
node --test test/plain-plugins.spec.js      # Single test file (no coverage)
npm run check:lint                          # ESLint (neostandard)
npm run check:tsc                           # TypeScript type checking
npm run check:type-coverage                 # Type coverage (must be ≥99%, ignores test/)
npm run check:knip                          # Dead code detection
npm run build                               # Generate TypeScript declarations from JSDoc
```

## Architecture

- **ESM-only** (`"type": "module"`) — all source is JavaScript with JSDoc type annotations (no `.ts` files)
- **TypeScript declarations** are generated from JSDoc via `declaration.tsconfig.json`
- Entry point: `index.js` / `index.d.ts` re-exports from `lib/`
- Single production dependency: `@hapi/topo` (topological sorting)

### Plugin Loading Flow

1. `resolvePlainPlugins(deps, options)` → convenience entry point
2. `loadPlugins(processPlugin, options)` → creates an async loader closure that: normalizes the name → `require.resolve()` → path traversal check → `importAbsolutePath()` → calls `processPlugin()` callback → validates with `assertToBePluginDefinition()`
3. `resolvePluginsInOrder(deps, loader)` → recursively loads plugins and dependencies → builds dependency graph with `@hapi/topo` Sorter → returns topologically sorted array
4. `loadPluginsWithHooks(processPlugin, hooks, options)` → wraps `loadPlugins()` with `beforeLoad`/`afterLoad`/`onError` lifecycle hooks

### Source Files (`lib/`)

| File | Purpose |
|------|---------|
| `load-plugins.js` | Core `loadPlugins()` factory — creates plugin loaders with custom processing |
| `resolve-plugins.js` | `resolvePluginsInOrder()` — topological sort, validation, cycle detection |
| `plain-plugins.js` | `resolvePlainPlugins()` — convenience wrapper for simple use cases |
| `hooks.js` | `loadPluginsWithHooks()` — lifecycle hooks wrapper around `loadPlugins()` |
| `normalize-plugin-name.js` | Plugin name normalization with optional prefix (like eslint-config) |
| `utils.js` | `getExtensionlessBasename()`, `importAbsolutePath()`, type guards |
| `advanced-types.d.ts` | `PluginDefinition` interface (hand-written types, not generated) |

### Tests (`test/`)

- Uses **Node.js native test runner** (`node --test`) with `sinon` for mocks
- Test files: `*.spec.js`
- Type tests: `typetests/*.tst.ts` via `tstyche`
- Fixtures in `test-fixtures/` (circular deps, traversal, prefixed, basic dependency)

## Code Conventions

- **Style**: neostandard via `@voxpelli/eslint-config` (flat config in `eslint.config.js`)
- **Indentation**: 2 spaces, LF line endings (see `.editorconfig`)
- **Types**: JSDoc annotations in `.js` files, not TypeScript source. Type coverage must be ≥99%
- **Error handling**: Use error chains with `cause` property
- **Commits**: Conventional Commits enforced by husky `commit-msg` hook (`validate-conventional-commit`)
- **Pre-push hook**: runs `npm test` (full suite must pass before push)
- **No package-lock.json** — this is a library (`.npmrc: package-lock=false`)
- **Destructured options**: must be in sorted key order (enforced by `sort-destructure-keys` lint rule)
- **Catch parameter naming**: must use `err` not `error` (enforced by `unicorn/catch-error-name`)

## Design Decisions

- **Benchmark before optimizing**: Don't add performance optimizations (caching, memoization, fast paths) without first proving there's a measurable problem. First check whether the code path is even reachable — if it's provably unreachable, skip the optimization entirely. If it is reachable, benchmark using [mitata](https://npm.im/mitata) (see [async-htm-to-string](https://github.com/voxpelli/async-htm-to-string/blob/main/benchmark.js) for the pattern): create a `benchmark.js` at the repo root, run with `node --expose-gc benchmark.js`, use `group()`/`bench()`/`do_not_optimize()` to compare before/after, and only land the change if the improvement is distinct.
- **No caching in `loadPlugins`**: `resolvePluginsInOrder` already deduplicates via a `loadedPlugins` Set that prevents the loader from being called twice with the same plugin name. A cache inside `loadPlugins` would never get a hit during normal usage — the deduplication happens one layer up.

## CI/CD

GitHub Actions workflows: `nodejs.yml` (Node 20/22/24, ubuntu + windows), `lint.yml`, `compliance.yml`, `ts-internal.yml` (tests against TypeScript next). Releases via `release-please`.

## Node/TypeScript Version Support

- Node: `^20.19.0 || ^22.13.0 || >=24`
- TypeScript: `>=5.8`
