import { describe, expect, test } from 'tstyche';

import {
  assertToBePluginDefinition,
  isPluginDefinition,
  loadPlugins,
  resolvePluginsInOrder,
  resolvePlainPlugins,
} from 'plugin-importer';

import type { PluginDefinition, ProcessPluginContext } from 'plugin-importer';

describe('loadPlugins', () => {
  test('infers generic from processPlugin return type', () => {
    const loader = loadPlugins((_plugin: unknown, _context: ProcessPluginContext): PluginDefinition => {
      return { name: 'test', pluginDir: '/test' };
    });

    expect(loader).type.toBe<(pluginName: string) => Promise<PluginDefinition>>();
  });

  test('accepts options as second argument', () => {
    expect(
      loadPlugins(
        (_plugin: unknown, _context: ProcessPluginContext): PluginDefinition => ({ name: 'test' }),
        { cwd: '/foo' }
      )
    ).type.toBe<(pluginName: string) => Promise<PluginDefinition>>();
  });
});

describe('resolvePluginsInOrder', () => {
  test('returns Promise<T[]> without allowOptionalDependencies', () => {
    function loader (_pluginName: string): PluginDefinition { return { name: 'test' }; }

    expect(resolvePluginsInOrder(['foo'], loader)).type.toBe<Promise<PluginDefinition[]>>();
  });

  test('returns Promise<Array<T | false>> with allowOptionalDependencies', () => {
    function loader (_pluginName: string): PluginDefinition { return { name: 'test' }; }

    expect(resolvePluginsInOrder(['foo'], loader, true)).type.toBe<Promise<(PluginDefinition | false)[]>>();
  });
});

describe('resolvePlainPlugins', () => {
  test('returns Promise<Array<PluginDefinition>>', () => {
    expect(resolvePlainPlugins(['foo'])).type.toBe<Promise<PluginDefinition[]>>();
  });
});

describe('type guards', () => {
  test('isPluginDefinition narrows unknown to PluginDefinition', () => {
    const value: unknown = {};

    if (isPluginDefinition(value)) {
      expect(value).type.toBe<PluginDefinition>();
    }
  });

  test('assertToBePluginDefinition asserts value is PluginDefinition', () => {
    const value: unknown = {};

    assertToBePluginDefinition(value);
    expect(value).type.toBe<PluginDefinition>();
  });
});
