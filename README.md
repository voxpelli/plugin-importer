# Plugin Importer

Recursively imports a plugin tree in order of dependencies

[![npm version](https://img.shields.io/npm/v/plugin-importer.svg?style=flat)](https://www.npmjs.com/package/plugin-importer)
[![npm downloads](https://img.shields.io/npm/dm/plugin-importer.svg?style=flat)](https://www.npmjs.com/package/plugin-importer)
[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg)](https://github.com/voxpelli/eslint-config)
[![Module type: ESM](https://img.shields.io/badge/module%20type-esm-brightgreen)](https://github.com/voxpelli/badges-cjs-esm)
[![Types in JS](https://img.shields.io/badge/types_in_js-yes-brightgreen)](https://github.com/voxpelli/types-in-js)
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

* `isPluginDefinition(value)` – returns `true` if `value` is a valid `PluginDefinition` (and correctly narrows the type when used with TypeScript)
* `loadPlugins(processPlugin, [options])` – creates the plugin loader responsible for loading a valid plugin
* `resolvePluginsInOrder` –

### Plain plugins exports

* `loadPlainPlugins`
* `processPlainPlugin`
* `resolvePlainPlugins`

### Utils exports

* `getExtensionlessBasename`
* `importAbsolutePath`

## Types

* `LoadPluginsOptions`
* `PluginDefinition`
* `ProcessPluginContext`

## Similar modules

* [`example`](https://example.com/) – is similar in this way

## See also

* [Announcement blog post](#)
* [Announcement tweet](#)
