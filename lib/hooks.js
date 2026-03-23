import { loadPlugins } from './load-plugins.js';

/**
 * @typedef LifecycleHooks
 * @property {((pluginName: string) => void | Promise<void>)} [beforeLoad]
 * @property {((plugin: import('./advanced-types.d.ts').PluginDefinition, pluginName: string) => void | Promise<void>)} [afterLoad]
 * @property {((error: Error, pluginName: string) => import('./advanced-types.d.ts').PluginDefinition | void | undefined | Promise<import('./advanced-types.d.ts').PluginDefinition | undefined>)} [onError]
 */

/**
 * @template {import('./advanced-types.d.ts').PluginDefinition} A
 * @param {(plugin: unknown, context: import('./load-plugins.js').ProcessPluginContext) => A|Promise<A>} processPlugin
 * @param {LifecycleHooks} hooks
 * @param {import('./load-plugins.js').LoadPluginsOptions} [options]
 * @returns {(pluginName: string) => Promise<A>}
 */
export function loadPluginsWithHooks (processPlugin, hooks, options) {
  const baseLoader = loadPlugins(processPlugin, options);

  return async (pluginName) => {
    await hooks.beforeLoad?.(pluginName);

    try {
      const result = await baseLoader(pluginName);
      await hooks.afterLoad?.(result, pluginName);
      return result;
    } catch (err) {
      if (hooks.onError && err instanceof Error) {
        const recovery = await hooks.onError(err, pluginName);

        if (recovery !== undefined) {
          return /** @type {A} */ (recovery);
        }
      }

      throw err;
    }
  };
}
