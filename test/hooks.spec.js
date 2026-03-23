import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import sinon from 'sinon';
import { join } from 'desm';

import { loadPluginsWithHooks } from '../lib/hooks.js';
import { processPlainPlugin } from '../lib/plain-plugins.js';
import { resolvePluginsInOrder } from '../lib/resolve-plugins.js';

describe('Hooks', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('loadPluginsWithHooks()', () => {
    it('should call beforeLoad before loading a plugin', async () => {
      /** @type {string[]} */
      const calls = [];

      const loader = loadPluginsWithHooks(processPlainPlugin, {
        beforeLoad (pluginName) {
          calls.push(`before:${pluginName}`);
        },
      }, {
        cwd: join(import.meta.url, '../test-fixtures/'),
      });

      await loader('./test-dependency');

      assert.deepStrictEqual(calls, ['before:./test-dependency']);
    });

    it('should call afterLoad after loading a plugin', async () => {
      /** @type {string[]} */
      const calls = [];

      const loader = loadPluginsWithHooks(processPlainPlugin, {
        afterLoad (plugin, pluginName) {
          calls.push(`after:${pluginName}:${plugin.name}`);
        },
      }, {
        cwd: join(import.meta.url, '../test-fixtures/'),
      });

      await loader('./test-dependency');

      assert.deepStrictEqual(calls, ['after:./test-dependency:test-dependency']);
    });

    it('should call onError on failure and allow recovery', async () => {
      const loader = loadPluginsWithHooks(processPlainPlugin, {
        onError (_error, pluginName) {
          return { name: `fallback-${pluginName}` };
        },
      }, {
        cwd: join(import.meta.url, '../test-fixtures/'),
      });

      const result = await loader('nonexistent-plugin');

      assert.strictEqual(result.name, 'fallback-nonexistent-plugin');
    });

    it('should reject invalid recovery plugin from onError', async () => {
      const loader = loadPluginsWithHooks(processPlainPlugin, {
        onError () {
          return /** @type {import('../lib/advanced-types.d.ts').PluginDefinition} */ (
            /** @type {unknown} */ ({ dependencies: 'not-an-array' })
          );
        },
      }, {
        cwd: join(import.meta.url, '../test-fixtures/'),
      });

      await assert.rejects(
        () => loader('nonexistent-plugin'),
        { message: /Expected "dependencies" property to be an array of strings/ }
      );
    });

    it('should re-throw if onError returns undefined', async () => {
      const loader = loadPluginsWithHooks(processPlainPlugin, {
        onError () {},
      }, {
        cwd: join(import.meta.url, '../test-fixtures/'),
      });

      await assert.rejects(
        () => loader('nonexistent-plugin'),
        { message: /Failed to find plugin "nonexistent-plugin"/ }
      );
    });

    it('should work with no hooks provided', async () => {
      const loader = loadPluginsWithHooks(processPlainPlugin, {}, {
        cwd: join(import.meta.url, '../test-fixtures/'),
      });

      const result = await loader('./test-dependency');

      assert.ok(result);
      assert.strictEqual(result.name, 'test-dependency');
    });

    it('should work with resolvePluginsInOrder', async () => {
      /** @type {string[]} */
      const loadOrder = [];

      const loader = loadPluginsWithHooks(processPlainPlugin, {
        afterLoad (_plugin, pluginName) {
          loadOrder.push(pluginName);
        },
      }, {
        cwd: join(import.meta.url, '../test-fixtures/'),
      });

      const result = await resolvePluginsInOrder(['./test-dependency'], loader);

      assert.ok(result);
      assert.strictEqual(result.length, 2);
      assert.ok(loadOrder.length > 0);
    });
  });
});
