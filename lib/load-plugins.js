import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { normalizePluginName } from './normalize-plugin-name.js';
import { isPluginDefinition } from './resolve-plugins.js';
import { importAbsolutePath } from './utils.js';

/**
 * @typedef LoadPluginsOptions
 * @property {string|undefined} [cwd]
 * @property {ImportMeta} [meta]
 * @property {string|undefined} [prefix]
 */

/**
 * @typedef ProcessPluginContext
 * @property {string} pluginDir
 * @property {string} normalizedPluginName
 */

/**
 * @template {import('./advanced-types.d.ts').PluginDefinition} A
 * @param {(plugin: unknown, context: ProcessPluginContext) => A|Promise<A>} processPlugin
 * @param {LoadPluginsOptions} [options]
 * @returns {(pluginName: string) => Promise<A>}
 */
export function loadPlugins (processPlugin, options = {}) {
  const {
    cwd: rawCwd,
    meta,
    prefix,
  } = options;

  if (meta && rawCwd) {
    throw new Error('Can not provide both cwd and meta at once');
  }

  const cwd = meta
    ? path.dirname(fileURLToPath(meta.url))
    : rawCwd || process.cwd();

  const require = createRequire(cwd + path.sep);

  /**
   * @param {string} pluginName
   * @returns {Promise<A>}
   */
  return async (pluginName) => {
    const normalizedPluginName = normalizePluginName(pluginName, prefix);

    /** @type {string} */
    let pluginPath;

    try {
      pluginPath = require.resolve(normalizedPluginName);
    } catch (cause) {
      throw new Error(`Failed to find plugin "${pluginName}" in "${cwd}"`, { cause });
    }

    if (path.relative(cwd, pluginPath).startsWith('../')) {
      throw new Error(`Path traversal detected for "${pluginName}", trying to load outside of "${cwd}": ${pluginPath}`);
    }

    /** @type {unknown} */
    const loadedPlugin = await importAbsolutePath(pluginPath)
      .catch(/** @param {unknown} cause */ cause => {
        throw new Error(`Failed to load plugin "${pluginName}"`, { cause });
      });

    const pluginDir = path.dirname(pluginPath);

    const plugin = await processPlugin(loadedPlugin, {
      pluginDir,
      normalizedPluginName,
    });

    if (!isPluginDefinition(plugin)) {
      throw new Error('Invalid plugin definition');
    }

    const { dependencies, ...otherPluginProperties } = plugin;

    const dependenciesRelativeToCwd = dependencies?.map(dependency => {
      if (!dependency.startsWith('.')) {
        return dependency;
      }

      const absolutePath = path.resolve(pluginDir, dependency);
      const relativeToCwd = '.' + path.sep + path.relative(cwd, absolutePath);

      return relativeToCwd;
    });

    const result = /** @type {A} */ ({
      ...(dependencies ? { dependencies: dependenciesRelativeToCwd } : undefined),
      ...otherPluginProperties,
    });

    return result;
  };
}
