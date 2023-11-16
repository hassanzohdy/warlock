import { GenericObject, rtrim } from "@mongez/reinforcements";

/**
 * Make a proper key for the cache
 */
export function parseCacheKey(
  key: string | GenericObject,
  options: { globalPrefix?: string | (() => string) } = {},
) {
  if (typeof key === "object") {
    key = JSON.stringify(key);
  }

  // remove any curly braces and double quotes
  key = key.replace(/[{}"]/g, "").replaceAll(":", ".").replaceAll(",", ".");

  const cachePrefix =
    typeof options.globalPrefix === "function"
      ? options.globalPrefix()
      : options.globalPrefix;

  return String(cachePrefix ? rtrim(cachePrefix, ".") + "." + key : key);
}
