import { loadPlugins } from './load-plugins.js';
import { assertToBePluginDefinition, resolvePluginsInOrder } from './resolve-plugins.js';
import { getExtensionlessBasename } from './utils.js';

/**
 * @param {unknown} plugin
 * @param {import('./load-plugins.js').ProcessPluginContext} context
 * @returns {import('./advanced-types.d.ts').PluginDefinition}
 */
export function processPlainPlugin (plugin, { normalizedPluginName, pluginDir }) {
  if (!plugin || typeof plugin !== 'object') {
    throw new TypeError('Invalid plugin definition, expected an object');
  }

  const supplementedValue = {
    name: normalizedPluginName.startsWith('.')
      ? getExtensionlessBasename(normalizedPluginName)
      : normalizedPluginName,
    pluginDir,
    ...plugin,
  };

  try {
    assertToBePluginDefinition(plugin);
  } catch (cause) {
    throw new Error('Invalid plugin definition', { cause });
  }

  return supplementedValue;
}

/**
 * @param {import('./load-plugins.js').LoadPluginsOptions} [options]
 * @returns {(pluginName: string) => Promise<import('./advanced-types.d.ts').PluginDefinition>}
 */
export function loadPlainPlugins (options = {}) {
  return loadPlugins(processPlainPlugin, options);
}

/**
 * @param {string[]} dependencies
 * @param {import('./load-plugins.js').LoadPluginsOptions} [options]
 * @returns {Promise<Array<import('./advanced-types.d.ts').PluginDefinition>>}
 */
export async function resolvePlainPlugins (dependencies, options) {
  return resolvePluginsInOrder(dependencies, loadPlainPlugins(options));
}
