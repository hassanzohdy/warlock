import { url } from "../utils/urls";
import { router } from "./router";

/**
 * Generate a url for the given route name
 */
export function route(name: string, params: any = {}) {
  return url(router.route(name, params));
}
