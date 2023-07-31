import { createRequire } from 'node:module';
import path from 'node:path';

import { normalizePluginName as originalNormalizePluginName } from './normalize-plugin-name.js';
import { isPluginDefinition } from './resolve-plugins.js';
import { importAbsolutePath } from './utils.js';

/**
 * @typedef LoadPluginsOptions
 * @property {typeof import('./normalize-plugin-name.js').normalizePluginName} [customNormalizePluginName]
 * @property {string|undefined} [cwd]
 * @property {string|undefined} [prefix]
 */

/**
 * @typedef ProcessPluginContext
 * @property {string} pluginDir
 * @property {string} normalizedPluginName
 */

/**
 * @template {import('./advanced-types.d.ts').PluginDefinition} A
 * @param {(value: unknown, context: ProcessPluginContext) => A} processPlugin
 * @param {LoadPluginsOptions} [options]
 * @returns {(pluginName: string) => Promise<A>}
 */
export function loadPlugins (processPlugin, options = {}) {
  const {
    customNormalizePluginName,
    cwd = process.cwd(),
    prefix,
  } = options;

  const require = createRequire(cwd + path.sep);
  const normalizePluginName = customNormalizePluginName || originalNormalizePluginName;

  /**
   * @param {string} pluginName
   * @returns {Promise<A>}
   */
  return async (pluginName) => {
    const normalizedPluginName = normalizePluginName(pluginName, prefix);
    const pluginPath = require.resolve(normalizedPluginName);

    /** @type {unknown} */
    const loadedPlugin = await importAbsolutePath(pluginPath)
      .catch(cause => {
        throw new Error(`Failed to load plugin "${pluginName}"`, { cause });
      });

    const plugin = processPlugin(loadedPlugin, {
      pluginDir: path.dirname(pluginPath),
      normalizedPluginName,
    });

    if (!isPluginDefinition(plugin)) {
      throw new Error('Invalid plugin definition');
    }

    return plugin;
  };
}