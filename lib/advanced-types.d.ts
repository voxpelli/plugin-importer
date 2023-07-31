export interface PluginDefinition {
  name?: string,
  // TODO: Isn't this always set?
  pluginDir?: string,
  dependencies?: string[],
}
