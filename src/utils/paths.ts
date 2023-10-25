import { rootPath } from "@mongez/node";

/**
 * Get the absolute path to the storage folder to the given path
 *
 * If no path is given, it will return the absolute path to the storage folder
 */
export function storagePath(relativePath = "") {
  return rootPath("storage", relativePath);
}

/**
 * Get the absolute path to the uploads folder to the given path
 *
 * If no path is given, it will return the absolute path to the uploads folder
 */
export function uploadsPath(relativePath = "") {
  return rootPath("storage", "uploads", relativePath);
}

/**
 * Get the absolute path to the public folder to the given path
 *
 * If no path is given, it will return the absolute path to the public folder
 */
export function publicPath(relativePath = "") {
  return rootPath("public", relativePath);
}

/**
 * Get the absolute path to the cache folder to the given path
 *
 * If no path is given, it will return the absolute path to the cache folder
 */
export function cachePath(relativePath = "") {
  return rootPath("storage", "cache", relativePath);
}

/**
 * App path
 */
export function appPath(relativePath = "") {
  return rootPath("src/app", relativePath);
}

/**
 * Console path
 */
export function consolePath(relativePath = "") {
  return rootPath("src/console", relativePath);
}

/**
 * Remove any invalid characters from the file path using regex
 * It should accept any language character, numbers, and the following characters: _ - .
 */
const invalidCharsRegex = /[<>:"/\\|?*]/g; // Regex to match invalid characters
export function sanitizePath(filePath: string) {
  return filePath.replace(invalidCharsRegex, ""); // Replace invalid characters with an empty string
}

/**
 * Warlock path
 * PLEASE DO NOT add any files in this directory as it may be deleted
 */
export function warlockPath(...path: string[]) {
  return rootPath(".warlock", ...path);
}
