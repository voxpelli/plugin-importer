# Vision

> Dependency-ordered plugin loading for Node.js — nothing more, nothing less.

## Positioning

`plugin-importer` is the infrastructure primitive for loading plugins in the correct order. It sits below frameworks (Fastify/avvio, Architect) but above raw `import()`. It solves one problem well: given a list of plugin specifiers with declared dependencies, load them in topological order with name normalization, circular dependency detection, and path traversal protection.

One production dependency. ~200 lines of core logic.

## What This Is

- A dependency resolver for plugin trees using topological sorting ([`@hapi/topo`](https://github.com/hapijs/topo))
- Framework-agnostic — works with any plugin shape via the `processPlugin` callback
- ESLint-style name normalization with configurable prefixes
- Security-conscious — path traversal detection and circular dependency errors out of the box
- Zero-config for simple cases (`resolvePlainPlugins`), fully composable for complex ones (`loadPlugins` + `resolvePluginsInOrder`)
- Single production dependency, ESM-native, cross-platform (Windows + Unix)

## What This Is Not

- Not a plugin framework — no lifecycle hooks, no dependency injection, no event bus
- Not a runtime package installer — unlike [live-plugin-manager](https://github.com/davideicardi/live-plugin-manager), this does not install packages from npm at runtime
- Not a plugin discovery mechanism — no filesystem scanning, no convention-based auto-loading
- Not framework-specific — not tied to ESLint, Babel, Webpack, or any other tool
- Not a replacement for `import()` — it wraps dynamic imports with ordering and validation

## SWOT Analysis

### Strengths

- **Unique niche:** Only library offering framework-agnostic, dependency-ordered plugin loading
- **Minimal surface:** ~200 lines of core logic, 1 dependency ([`@hapi/topo`](https://www.npmjs.com/package/@hapi/topo) — 4.7M weekly downloads, battle-tested in the hapi ecosystem)
- **Type-safe:** 99%+ type coverage via JSDoc, generated `.d.ts` declarations for consumers
- **Security defaults:** Path traversal protection and circular dependency detection without configuration
- **Clean API layering:** One-liner convenience (`resolvePlainPlugins`) alongside composable factory (`loadPlugins`)
- **Well-maintained:** CI on Node 20/22/24, Ubuntu + Windows, conventional commits, automated releases via release-please

### Weaknesses

- **Low adoption:** Very few weekly downloads and dependents — the library is nearly invisible
- **Load-only:** No plugin lifecycle management (init, start, stop, destroy)
- **No caching:** Repeated resolution of the same tree re-imports everything
- **Minimal metadata:** `PluginDefinition` only carries `name`, `pluginDir`, and `dependencies`
- **Poor discoverability:** `package.json` keywords are limited, README lacks comparison section
- **Test gaps:** Prefix option integration path is untested (existing TODO)

### Opportunities

- **Framework authors** need plugin loading infrastructure but do not want to build ordering from scratch — this is the reusable primitive they are missing
- **Plugin fatigue:** Every tool (ESLint, Prettier, PostCSS, Babel) reinvents plugin ordering; a shared primitive could gain traction
- **TypeScript-first ecosystem:** Strong types are a differentiator as TypeScript adoption continues growing
- **ESM shift:** The Node.js ecosystem is moving toward small, composable ESM modules — this library fits that trend perfectly
- **Canonical answer:** Could become the standard recommendation for "how do I add a plugin system to my tool"

### Threats

- **Framework bundling:** Tools like Fastify (avvio), Webpack (tapable), and others continue shipping their own plugin resolution, reducing perceived need for a standalone solution
- **Low adoption risk:** If adoption stays low, maintenance motivation may decline
- **Larger ecosystem competition:** Projects with more reach (unjs, sindresorhus ecosystem) could ship a competing utility
- **Micro-library backlash:** Growing supply chain security concerns may push developers away from small dependencies
- **Dependency stability:** `@hapi/topo` has not released in 3 years (though it is stable and maintained)

## Target Audiences

**Primary:** Node.js tool and library authors building plugin systems — CLI frameworks, linters, static site generators, bot frameworks, CMS systems — who need dependency ordering without framework lock-in.

**Secondary:** Teams maintaining internal tooling with plugin architectures that currently enforce manual plugin ordering in configuration files.

**Tertiary:** Contributors to existing tools (ESLint, Prettier, PostCSS) evaluating automatic dependency ordering as an improvement to manual config-based ordering.

## Competitive Landscape

| Library | Weekly Downloads | Scope | How plugin-importer differs |
|---------|-----------------|-------|---------------------------|
| [avvio](https://github.com/fastify/avvio) (Fastify) | ~1.17M | Full plugin lifecycle + DI + graph-based bootstrap | Too heavy for "just load in order" — tightly coupled to Fastify patterns |
| [toposort](https://www.npmjs.com/package/toposort) | ~6.8M | Raw graph sorting only | No plugin loading, no name normalization, no security protections |
| [@hapi/topo](https://www.npmjs.com/package/@hapi/topo) | ~4.7M | Group-aware topological sort primitive | Used *by* plugin-importer; raw sorting API, not plugin-aware |
| [plugnplay](https://github.com/e0ipso/plugnplay) | Low | Plugin discovery + YAML metadata | No dependency ordering, last published 3 years ago |
| [Architect](https://github.com/c9/architect) (c9) | Low | Full DI framework for large apps | Too opinionated, overkill for simple plugin loading |

**The gap:** No lightweight, framework-agnostic library provides automatic dependency-ordered plugin loading with name normalization and security protections. Most tools force users to manually order plugins in configuration files.

## Design Principles

1. **Do one thing well.** Load plugins in dependency order. Resist scope creep into lifecycle management, dependency injection, or event systems.
2. **Composable over comprehensive.** Provide building blocks (`loadPlugins`, `resolvePluginsInOrder`, `normalizePluginName`) that compose into custom solutions — not a monolithic API.
3. **Zero magic.** No implicit file scanning, no convention-based auto-discovery, no runtime installation. Everything is explicit.
4. **Type safety is not optional.** Maintain 99%+ type coverage. JSDoc annotations in source, generated `.d.ts` declarations for consumers.
5. **Minimal dependencies.** Every new dependency must justify its inclusion. Currently: only `@hapi/topo`.

## Branding

### Voice & Tone

Technical, direct, unpretentious. Documentation reads like it was written by a senior engineer explaining a utility to a peer. No marketing language, no feature inflation. Limitations are acknowledged honestly.

### Messaging Pillars

1. **"One job, done right"** — Focused scope is a feature, not a limitation
2. **"Framework-agnostic infrastructure"** — Use it inside your tool, not as your tool
3. **"Security by default"** — Path traversal protection and circular dependency detection without configuration
4. **"Type-safe from source to consumer"** — JSDoc types in source, generated `.d.ts` for consumers

### Discoverability

- Expand `package.json` keywords beyond `"plugins"` to include: `plugin-loader`, `plugin-resolver`, `plugin-system`, `dependency-order`, `topological-sort`, `esm`, `plugin-dependencies`
- Add a "When to Use This" section and competitive comparison table to the README
- Submit to the [awesome-micro-npm-packages](https://github.com/parro-it/awesome-micro-npm-packages) list
