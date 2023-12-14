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

export enum EXPIRES_AFTER {
  HALF_HOUR = 1800,
  ONE_HOUR = 3600,
  HALF_DAY = 43200,
  ONE_DAY = 86400,
  ONE_WEEK = 604800,
  HALF_MONTH = 1296000,
  ONE_MONTH = 2592000,
  TWO_MONTHS = 5184000,
  SIX_MONTHS = 15768000,
  ONE_YEAR = 31536000,
}
