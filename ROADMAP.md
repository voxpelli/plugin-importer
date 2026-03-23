# Roadmap

This roadmap tracks planned improvements for plugin-importer. It is organized in phases but is not a commitment schedule — priorities may shift based on real-world usage and contributor interest.

See [VISION.md](./VISION.md) for strategic positioning and design principles.

---

## Phase 1: v0.3 — Template Alignment & Quality

Goal: Reach 100% alignment with [voxpelli/node-module-template](https://github.com/voxpelli/node-module-template) and close known quality gaps.

### Add tstyche type-level tests

The maintainer template expects type-level testing via [TSTyche](https://tstyche.org/). Add tests that verify the public API types work correctly:

- Add `tstyche` (^6.2.0) to devDependencies
- Create `typetests/` directory with `.tst.ts` files
- Add `check-type-tests` script matching the template pattern
- Update `.knip.jsonc` to include `typetests/**/*.tst.ts` as entry
- Key type contracts to test:
  - `loadPlugins` correctly infers the generic return type from `processPlugin`
  - `resolvePluginsInOrder` overload signatures (returns `T[]` vs `Array<T | false>` based on `allowOptionalDependencies`)
  - `isPluginDefinition` / `assertToBePluginDefinition` type narrowing

### Test the prefix option end-to-end

Address the existing `TODO: Test prefix option` in `test/plain-plugins.spec.js`. Create test fixtures that exercise `resolvePlainPlugins` with a prefix to verify name normalization flows through correctly in integration.

### Update engines field

Align with the template:
- **From:** `^20.15.0 || >=22.2.0`
- **To:** `^20.19.0 || ^22.13.0 || >=24`
- **Add:** `"typescript": ">=5.8"` engine

### Align devDependency versions

Bring devDependencies up to template parity:
- `@voxpelli/tsconfig` → ^16.1.0
- `c8` → ^11.0.0
- `installed-check` → ^10.0.1
- `eslint` → ^9.39.4
- Add `@voxpelli/typed-utils` ^4.0.0 if applicable
- Update `installed-check` ignore list to include `-i tstyche`

### Align npm scripts with template

- Update `check:lint` from `eslint --report-unused-disable-directives .` to `eslint` (ESLint v9+ handles unused-disable-directives via config)
- Update `check` script to run `check-type-tests` after parallel checks
- Add `husky-enable` / `husky-disable` convenience scripts
- Evaluate removing `prepare` script (template uses explicit `husky-enable`)

### Expand npm keywords

Current keywords: `["plugins"]`

Add: `plugin-loader`, `plugin-resolver`, `plugin-system`, `dependency-order`, `topological-sort`, `esm`, `plugin-dependencies`

### Resolve `PluginDefinition.pluginDir` TODO

The `lib/advanced-types.d.ts` file has a TODO comment: `// TODO: Isn't this always set?` for the `pluginDir` property. Investigate whether it is always set in practice and either make it required or document why it remains optional.

---

## Phase 2: v0.4 — Documentation & Developer Experience

Goal: Make the library easy to discover, understand, and adopt.

### README refresh

- Fix the typo on line 68: "diretcly" → "directly"
- Add a **"When to Use This"** section explaining ideal use cases
- Add a **"Comparison"** table positioning against avvio, toposort, plugnplay, and Architect
- Add a real-world `processPlugin` example showing validation and metadata enrichment
- Improve the npm description to be more compelling

### Richer `ProcessPluginContext`

Extend the context passed to `processPlugin` callbacks (additive, non-breaking):
- `originalName` — the raw name before normalization
- `resolvedPath` — the full absolute path from `require.resolve`

### Better error messages

- When `require.resolve` fails: hint that the module may need to be installed
- On path traversal detection: explain what path traversal protection means and why it exists
- On circular dependencies: show the dependency cycle chain for easier debugging

### Plugin loading cache (opt-in)

Add a `Map`-based cache in the `loadPlugins` closure, keyed on normalized plugin name. This avoids redundant `require.resolve` + `import()` calls when the same loader is reused across multiple `resolvePluginsInOrder` calls. Disabled by default for backwards compatibility.

---

## Phase 3: v0.5 — Extensibility

Goal: Enable advanced use cases without bloating the core.

### Plugin lifecycle hooks (opt-in)

Design as a separate export (`loadPluginsWithLifecycle`) to keep the core `loadPlugins` unchanged. Simple callback options — not an event emitter:
- `beforeLoad(pluginName, context)` — called before each plugin is loaded
- `afterLoad(plugin, context)` — called after each plugin is loaded and processed
- `onError(error, pluginName)` — called when a plugin fails to load

### Conditional dependency support

Extend beyond the current `?` suffix (optional dependencies) to support peer-dependency-style semantics: a dependency is required only if it appears in the top-level plugin list.

---

## Phase 4: v1.0 — Stability

Goal: Signal production readiness with a stable API contract.

### API surface audit

Review every public export and decide what to commit to long-term:
- Should `normalizePluginName` remain exported or become internal?
- Should `getExtensionlessBasename` remain exported or become internal?
- Should `importAbsolutePath` remain exported or become internal?

### PluginDefinition contract specification

Write a clear specification of what a plugin module must export to be loadable. Currently this is only implicitly documented through the `PluginDefinition` type and the `processPlainPlugin` function.

### Comprehensive error catalog

Document every error the library can throw: what causes it, what it means, and how to fix it.

### Performance benchmarks

Add a benchmark suite (e.g., [tinybench](https://github.com/tinylibs/tinybench)) measuring resolution time for plugin trees of various sizes (10, 100, 1000 plugins). Establishes a baseline and prevents regressions.

### Evaluate `@hapi/topo` dependency

`@hapi/topo` is stable and battle-tested but has not released in 3 years. Evaluate whether the topological sort algorithm (~100 lines) should be inlined to reduce the dependency surface. The goal is not removal for its own sake, but informed evaluation.

### Security review

Review path traversal protection for edge cases. Consider whether `require.resolve` behavior could be exploited. Document the threat model.

---

## Non-Goals

These are explicitly out of scope for plugin-importer and will not be pursued:

- **Runtime package installation** — use npm, pnpm, or yarn
- **Plugin sandboxing or isolation** — use VM modules or worker threads
- **Plugin marketplace or registry**
- **Hot module reloading**
- **GUI or dashboard for plugin management**
- **Framework-specific adapters** — consumers build those on top of this library

---

## Contributing

Contributions aligned with this roadmap are welcome. Please follow [conventional commits](https://www.conventionalcommits.org/) and ensure PRs include tests that maintain 99%+ type coverage.
