import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { join } from 'desm';

import {
  resolvePlainPlugins,
} from '../index.js';

describe('Plain Plugins', () => {
  describe('resolvePlainPlugins()', () => {
    it('should resolve plugins recursively', async () => {
      const result = await resolvePlainPlugins([
        './test-dependency',
      ], {
        cwd: join(import.meta.url, '../test-fixtures/'),
      });

      assert.ok(result);
      assert.deepStrictEqual(result, [
        {
          foo: 'bar2',
          name: 'test-dependency-2',
          pluginDir: join(import.meta.url, '../test-fixtures/test-dependency'),
        },
        {
          dependencies: [
            './test-dependency/test-dependency-2.js',
          ],
          foo: 'bar',
          name: 'test-dependency',
          pluginDir: join(import.meta.url, '../test-fixtures/test-dependency'),
        },
      ]);
    });

    it('should throw on path traversal', async () => {
      try {
        await resolvePlainPlugins([
          './traversal',
        ], {
          cwd: join(import.meta.url, '../test-fixtures/'),
        });
        assert.fail('Expected resolvePlainPlugins to fail');
      } catch (err) {
        assert(err instanceof Error);
        assert.strictEqual(err.message, 'Failed to load plugin "./../index.js"');
        assert(err.cause instanceof Error);
        assert.match(err.cause.message, /^Path traversal detected for "\.\/\.\.\/index\.js", trying to load outside of "/);
      }
    });

    it('should throw on circular dependencies', async () => {
      try {
        await resolvePlainPlugins([
          './circular',
        ], {
          cwd: join(import.meta.url, '../test-fixtures/'),
        });
        assert.fail('Expected resolvePlainPlugins to fail');
      } catch (err) {
        assert(err instanceof Error);
        assert.strictEqual(err.message, 'Failed to add plugin "./circular/index.js"');
        assert(err.cause instanceof Error);
        assert.strictEqual(err.cause.message, 'item added into group ./circular/index.js created a dependencies error');
      }
    });

    it('should support import.meta in place of cwd', async () => {
      const result = await resolvePlainPlugins([
        './test-dependency',
      ], {
        meta: {
          url: (new URL('../test-fixtures/index.js', import.meta.url)).toString(),
        },
      });

      assert.ok(result);
      assert.strictEqual(result.length, 2);
    });

    it('should throw if both import.meta and cwd has been given', async () => {
      try {
        await resolvePlainPlugins([
          './test-dependency',
        ], {
          cwd: join(import.meta.url, '../test-fixtures/'),
          meta: {
            url: (new URL('../test-fixtures/index.js', import.meta.url)).toString(),
          },
        });
        assert.fail('Expected resolvePlainPlugins to fail');
      } catch (err) {
        assert(err instanceof Error);
        assert.strictEqual(err.message, 'Can not provide both cwd and meta at once');
      }
    });

    // TODO: Test prefix option
  });
});
