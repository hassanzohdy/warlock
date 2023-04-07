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
