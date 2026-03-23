import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { normalizePluginName } from './normalize-plugin-name.js';
import { assertToBePluginDefinition } from './resolve-plugins.js';
import { importAbsolutePath } from './utils.js';

/**
 * @typedef LoadPluginsOptions
 * @property {string|undefined} [cwd]
 * @property {Pick<ImportMeta, 'url'>} [meta]
 * @property {string|undefined} [prefix]
 * @property {boolean} [cache]
 */

/**
 * @typedef ProcessPluginContext
 * @property {string} pluginDir
 * @property {string} normalizedPluginName
 * @property {string} originalName
 * @property {string} resolvedPath
 */

/**
 * @template {import('./advanced-types.d.ts').PluginDefinition} A
 * @param {(plugin: unknown, context: ProcessPluginContext) => A|Promise<A>} processPlugin
 * @param {LoadPluginsOptions} [options]
 * @returns {(pluginName: string) => Promise<A>}
 */
export function loadPlugins (processPlugin, options = {}) {
  const {
    cache: enableCache,
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

  /** @type {Map<string, A> | undefined} */
  const pluginCache = enableCache ? new Map() : undefined;

  /**
   * @param {string} pluginName
   * @returns {Promise<A>}
   */
  return async (pluginName) => {
    const normalizedPluginName = normalizePluginName(pluginName, prefix);

    if (pluginCache?.has(normalizedPluginName)) {
      return /** @type {A} */ (pluginCache.get(normalizedPluginName));
    }

    /** @type {string} */
    let pluginPath;

    try {
      pluginPath = require.resolve(normalizedPluginName);
    } catch (cause) {
      throw new Error(`Failed to find plugin "${pluginName}" in "${cwd}". Is the module installed?`, { cause });
    }

    if (path.relative(cwd, pluginPath).startsWith('..' + path.sep)) {
      throw new Error(`Path traversal detected for "${pluginName}": resolves to "${pluginPath}" which is outside the allowed directory "${cwd}"`);
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
      originalName: pluginName,
      resolvedPath: pluginPath,
    });

    try {
      assertToBePluginDefinition(plugin);
    } catch (cause) {
      throw new Error(`Invalid plugin definition for "${normalizedPluginName}"`, { cause });
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

    pluginCache?.set(normalizedPluginName, result);

    return result;
  };
}
