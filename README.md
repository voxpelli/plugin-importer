# Plugin Importer

Recursively imports a plugin tree in order of dependencies

[![npm version](https://img.shields.io/npm/v/plugin-importer.svg?style=flat)](https://www.npmjs.com/package/plugin-importer)
[![npm downloads](https://img.shields.io/npm/dm/plugin-importer.svg?style=flat)](https://www.npmjs.com/package/plugin-importer)
[![neostandard javascript style](https://img.shields.io/badge/code_style-neostandard-7fffff?style=flat&labelColor=ff80ff)](https://github.com/neostandard/neostandard)
[![Module type: ESM](https://img.shields.io/badge/module%20type-esm-brightgreen)](https://github.com/voxpelli/badges-cjs-esm)
[![Types in JS](https://img.shields.io/badge/types_in_js-yes-brightgreen)](https://github.com/voxpelli/types-in-js)
[![Follow @voxpelli.com](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fpublic.api.bsky.app%2Fxrpc%2Fapp.bsky.actor.getProfile%2F%3Factor%3Dvoxpelli.com&query=%24.followersCount&style=social&logo=bluesky&label=Follow%20%40voxpelli.com)](https://bsky.app/profile/voxpelli.com)
[![Follow @voxpelli@mastodon.social](https://img.shields.io/mastodon/follow/109247025527949675?domain=https%3A%2F%2Fmastodon.social&style=social)](https://mastodon.social/@voxpelli)

## Usage

### Simple

```javascript
import { resolvePlainPlugins } from 'plugin-importer';

const loadedPlugins = await resolvePlainPlugins([
  './test-dependency',
  'module-dependency',
], {
  meta: import.meta, // Ensures local paths are resolved in relation to this file
});
```

### Powerful

```javascript
import { loadPlugins, resolvePluginsInOrder } from 'plugin-importer';

/**
 * @param {unknown} module
 * @param {import('plugin-importer').ProcessPluginContext} context
 * @returns {SupersetOfPluginDefinition}
 */
function processPlugin (module, { normalizedPluginName, pluginDir }) {
  // Whatever other stuff you want to do to resolve the SupersetOfPluginDefinition
}

const pluginLoader = loadPlugins(processPlugin, {
  meta: import.meta, // Ensures local paths are resolved in relation to this file
});

// loadedPlugins will be an ordered array of SupersetOfPluginDefinition,in order of who depends on whom
const loadedPlugins = await resolvePluginsInOrder(
  [
    './test-dependency',
    'module-dependency',
  ],
  pluginLoader
);
```

## Exports

### Core exports

* `assertToBePluginDefinition(value)` – throws if `value` isn't a valid `PluginDefinition` (and correctly narrows the type when used with TypeScript)
 * `isPluginDefinition(value)` – returns `true` if `value` is a valid `PluginDefinition` (and correctly narrows the type when used with TypeScript)
* `loadPlugins(processPlugin, [LoadPluginsOptions])` – creates the plugin loader responsible for loading a valid plugin
* `resolvePluginsInOrder(plugins, pluginLoader, [allowOptionalDependencies])` – resolves and loads plugins and returns them with the plugin depended upon first and the plugins depending on them last

### Plain plugins exports

* `loadPlainPlugins([LoadPluginsOptions])` – like `loadPlugins`, but geared to load pure `PluginDefinition` rather than supersets
* `processPlainPlugin` – the `processPlugin` that's used in `loadPlainPlugins`, should never be needed to be called diretcly
* `resolvePlainPlugins(dependencies, [LoadPluginsOptions])` – shortcut for calling `resolvePluginsInOrder` with `loadPlainPlugins`

### Utils exports

* `getExtensionlessBasename(value)` – like [`path.basename(value)`](https://nodejs.org/api/path.html#pathbasenamepath-suffix) but removes file extensions
* `importAbsolutePath(absolutePath)` – like [`import(absolutePath)`](https://nodejs.org/api/esm.html#import-expressions) but made to easily work with absolute paths on Windows

## Types

* `LoadPluginsOptions` – the optional options for `loadPlugins`. Contains:
  * `cwd` – the working directory to load relative plugin paths from
  * `meta` – convenience option for setting `cwd` by giving an [`import.meta`](https://nodejs.org/api/esm.html#importmeta)
  * `prefix` – a prefix that will be added to dependency names. Eg `example-prefix` would be added to `foo` to make `example-prefix-foo` and to `@voxpelli` to make `@voxpelli/example-prefix`, but eg. `example-prefix-foo` would not be prefixed as it already has the prefix and `@voxpelli/foo` would neither get prefixed. This is along the lines of what `eslint` does with [`eslint-config`](https://eslint.org/docs/latest/extend/shareable-configs#creating-a-shareable-config) prefixes
* `PluginDefinition` – the basic definition of a plugin. All loaded plugins are expected to conform to this or a superset of this.
* `ProcessPluginContext` – the context given to `processPlugin`
