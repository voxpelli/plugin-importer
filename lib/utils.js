import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * @param {unknown} value
 * @returns {value is unknown[]}
 */
export function isUnknownArray (value) {
  return Array.isArray(value);
}

/**
 * @param {string} value
 * @returns {string}
 */
export function getExtensionlessBasename (value) {
  if (typeof value !== 'string') {
    throw new TypeError('Invalid value, expected a string');
  }

  const basename = path.basename(value);
  const extensionSeparatorPosition = basename.indexOf('.');

  return extensionSeparatorPosition > 0
    ? basename.slice(0, extensionSeparatorPosition)
    : basename;
}

const DIRNAME = path.dirname(fileURLToPath(import.meta.url)) + path.sep;

/**
 * @param {string} inputPath
 * @returns {Promise<unknown>}
 */
export async function importAbsolutePath (inputPath) {
  const relativePath = path.relative(DIRNAME, inputPath);
  const relativePosixPath = './' + relativePath.replaceAll('\\', '/');

  /** @type {unknown} */
  let imported;

  try {
    imported = await import(relativePosixPath);
  } catch (cause) {
    throw new Error(`Failed import of ${relativePosixPath}`, { cause });
  }

  return imported;
}
