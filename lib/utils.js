import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * @param {unknown} value
 * @returns {value is unknown[]}
 */
export function isUnknownArray (value) {
  return Array.isArray(value);
}

const DIRNAME = path.dirname(fileURLToPath(import.meta.url)) + path.sep;

/**
 * @param {string} inputPath
 * @returns {Promise<unknown>}
 */
export async function importAbsolutePath (inputPath) {
  const relativePath = path.relative(DIRNAME, inputPath);
  const relativePosixPath = './' + relativePath.replaceAll('\\', '/');

  try {
    return import(relativePosixPath);
  } catch (cause) {
    throw new Error(`Failed import of ${relativePosixPath}`, { cause });
  }
}
