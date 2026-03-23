export interface PluginDefinition {
  name?: string,
  /** Always set by the built-in plugin loaders, but optional in the interface to allow custom processPlugin implementations */
  pluginDir?: string,
  dependencies?: string[],
}
