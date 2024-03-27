import { ltrim } from "@mongez/reinforcements";

let baseUrl = "";

/**
 * Set base url
 */
export function setBaseUrl(url: string) {
  baseUrl = url;
}

/**
 * Get full path for the given path
 */
export function url(path = "") {
  return baseUrl + path;
}

/**
 * Get uploads url
 */
export function uploadsUrl(path = "") {
  return url("/uploads/" + ltrim(path, "/"));
}

/**
 * Get full path for the given path related to public route
 */
export function publicUrl(path = "") {
  return url("/public/" + ltrim(path, "/"));
}

/**
 * Assets url
 */
export function assetsUrl(path = "") {
  return publicUrl("/assets/" + ltrim(path, "/"));
}
