import config from "@mongez/config";
import path from "path";

/**
 * Get root path or join the given paths to the root path
 */
export function rootPath(...paths: string[]) {
  return path.resolve(process.cwd(), ...paths);
}

/**
 * Get src directory path or join the given paths to the src directory path
 */
export function srcPath(...paths: string[]) {
  return rootPath("src", ...paths);
}

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
  const configPath = config.get("uploads.root");
  if (!configPath) {
    return rootPath("storage", "uploads", relativePath);
  }

  return typeof configPath === "function"
    ? configPath(relativePath)
    : path.resolve(configPath, relativePath);
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
 * Get a temp path
 */
export function tempPath(relativePath = "") {
  return rootPath("storage/temp", relativePath);
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

/**
 * Get config directory path
 */
export function configPath(...path: string[]) {
  return rootPath("src/config", ...path);
}
