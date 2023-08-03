import topo from '@hapi/topo';

import { isContentString, isStringArray } from './utils.js';

const Topo = topo.Sorter;

/**
 * @param {unknown} value
 * @returns {asserts value is import('./advanced-types.d.ts').PluginDefinition}
 */
export function assertToBePluginDefinition (value) {
  // Ensure we have an object, else its not a plugin definition
  if (!value || typeof value !== 'object') {
    throw new TypeError('Expected plugin definition to be an object');
  }

  if ('dependencies' in value && !isStringArray(value.dependencies)) {
    throw new TypeError('Expected "dependencies" property to be an array of strings');
  }

  if ('name' in value && !isContentString(value.name)) {
    throw new TypeError('Expected "name" property to be a non-empty string');
  }

  if ('pluginDir' in value && !isContentString(value.pluginDir)) {
    throw new TypeError('Expected "pluginDir" property to be a non-empty string');
  }
}

/**
 * @param {unknown} value
 * @returns {value is import('./advanced-types.d.ts').PluginDefinition}
 */
export function isPluginDefinition (value) {
  try {
    assertToBePluginDefinition(value);
    return true;
  } catch (err) {
    if (err instanceof TypeError) {
      return false;
    }
    throw err;
  }
}

/**
 * @template {import('./advanced-types.d.ts').PluginDefinition} T
 * @callback LoadPlugin
 * @param {string} pluginName
 * @returns {T|Promise<T>}
 */

/**
 * @template T
 * @typedef ResolvePluginOrderContext
 * @property {Set<string>} loadedPlugins
 * @property {Set<string>} missingPlugins
 * @property {import('@hapi/topo').Sorter<T|false>} orderedPlugins
 * @property {boolean} allowOptionalDependencies
 */

/**
 * @template {import('./advanced-types.d.ts').PluginDefinition} T
 * @param {string[]} plugins
 * @param {LoadPlugin<T>} loadPlugin
 * @param {ResolvePluginOrderContext<T>} context
 * @returns {Promise<void>}
 */
async function internalResolvePluginOrder (plugins, loadPlugin, context) {
  const {
    allowOptionalDependencies,
    loadedPlugins,
    missingPlugins,
    orderedPlugins,
  } = context;

  for (let pluginName of plugins) {
    const optionalDependency = allowOptionalDependencies && pluginName.endsWith('?');

    if (optionalDependency) {
      pluginName = pluginName.slice(0, -1);
    }

    if (loadedPlugins.has(pluginName)) {
      continue;
    }

    loadedPlugins.add(pluginName);

    /** @type {T} */
    let pluginDefinition;

    try {
      pluginDefinition = await loadPlugin(pluginName);
    } catch (cause) {
      throw new Error(`Failed to load plugin "${pluginName}"`, { cause });
    }

    if (!pluginDefinition) {
      if (optionalDependency && allowOptionalDependencies) {
        orderedPlugins.add(false, { group: pluginName });
      } else {
        missingPlugins.add(pluginName);
      }

      continue;
    }

    const dependencies = pluginDefinition.dependencies || [];

    try {
      orderedPlugins.add(pluginDefinition, {
        after: dependencies,
        group: pluginName,
      });
    } catch (cause) {
      throw new Error(`Failed to add plugin "${pluginName}"`, { cause });
    }

    await internalResolvePluginOrder(dependencies, loadPlugin, {
      allowOptionalDependencies,
      loadedPlugins,
      missingPlugins,
      orderedPlugins,
    });
  }
}

/**
 * @template {import('./advanced-types.d.ts').PluginDefinition} T
 * @overload
 * @param {string[]} plugins
 * @param {LoadPlugin<T>} loadPlugin
 * @returns {Promise<T[]>}
 */

/**
 * @template {import('./advanced-types.d.ts').PluginDefinition} T
 * @overload
 * @param {string[]} plugins
 * @param {LoadPlugin<T>} loadPlugin
 * @param {true} allowOptionalDependencies
 * @returns {Promise<Array<T|false>>}
 */

/**
 * @template {import('./advanced-types.d.ts').PluginDefinition} T
 * @param {string[]} plugins
 * @param {LoadPlugin<T>} loadPlugin
 * @param {true} [allowOptionalDependencies]
 * @returns {Promise<T[] | Array<T|false>>}
 */
export async function resolvePluginsInOrder (plugins, loadPlugin, allowOptionalDependencies) {
  if (!Array.isArray(plugins)) throw new TypeError('Expected plugins to be an array of strings');
  if (typeof loadPlugin !== 'function') throw new TypeError('Expected loadPlugin to be a function');

  /** @type {Set<string>} */
  const loadedPlugins = new Set();
  /** @type {Set<string>} */
  const missingPlugins = new Set();
  /** @type {import('@hapi/topo').Sorter<T|false>} */
  const orderedPlugins = new Topo();

  await internalResolvePluginOrder(plugins, loadPlugin, {
    allowOptionalDependencies: allowOptionalDependencies || false,
    loadedPlugins,
    missingPlugins,
    orderedPlugins,
  });

  if (missingPlugins.size > 0) {
    const values = [...missingPlugins];
    throw new Error(`Plugin${values.length > 1 ? 's' : ''} missing: "${values.join('", "')}"`);
  }

  return orderedPlugins.nodes;
}
