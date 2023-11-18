import { except } from "@mongez/reinforcements";
import { cache } from "../../cache";
import type { Request } from "./../request";
import { Response } from "./../response";

// TODO: Add option to determine whether to cache the response or not
// TODO: add option to determine what to be cached from the response
// TODO: add cache middleware config options for example to set the default driver, ttl, etc

export type CacheMiddlewareOptions = {
  /**
   * Cache key
   */
  cacheKey:
    | string
    | ((request: Request) => string)
    | ((request: Request) => Promise<string>);
  /**
   * If true, then the response will be cached based on the current locale code
   * This is useful when you have a multi-language website, and you want to cache the response based on the current locale
   *
   * @default true
   */
  withLocale?: boolean;
  /**
   * List of keys from the response object to omit from the cached response
   *
   * @default ['user']
   */
  omit?: string[];
  /**
   * Expires after number of seconds
   */
  expiresAfter?: number;
  /**
   * Cache driver
   *
   * @see config/cache.ts: drivers object
   * @default memory
   */
  driver?: string;
};

const defaultCacheOptions: Partial<CacheMiddlewareOptions> = {
  withLocale: true,
};

type ParsedCacheOptions = CacheMiddlewareOptions & {
  cacheKey: string;
};

async function parseCacheOptions(
  cacheOptions: CacheMiddlewareOptions | CacheMiddlewareOptions["cacheKey"],
  request: Request,
) {
  if (typeof cacheOptions === "string" || typeof cacheOptions === "function") {
    const cacheKey =
      typeof cacheOptions === "function"
        ? await cacheOptions(request)
        : cacheOptions;

    cacheOptions = {
      cacheKey,
    };
  }

  const finalCacheOptions = {
    ...defaultCacheOptions,
    ...cacheOptions,
  } as ParsedCacheOptions;

  if (finalCacheOptions.withLocale) {
    const locale = request.getLocaleCode();

    finalCacheOptions.cacheKey = `${finalCacheOptions.cacheKey}:${locale}`;
  }

  return finalCacheOptions;
}

export function cacheMiddleware(
  responseCacheOptions:
    | CacheMiddlewareOptions
    | CacheMiddlewareOptions["cacheKey"],
) {
  return async function (request: Request, response: Response) {
    const {
      expiresAfter,
      omit = ["user", "settings"],
      cacheKey,
      driver = "memory",
    } = await parseCacheOptions(responseCacheOptions, request);

    const cacheDriver = await cache.use(driver);

    const content = await cacheDriver.get(cacheKey);

    if (content) {
      const output = content.data;

      return response.baseResponse.send(output);
    }

    if (expiresAfter) {
      // response.onSending((response: Response) => {
      //   response.header("Cache-Control", `max-age=${expiresAfter}`);
      // });
    }

    response.onSent((response: Response) => {
      if (response.statusCode > 299 || response.request.path !== request.path) {
        return;
      }

      const content = {
        data: except(response.body, omit),
      };

      cacheDriver.set(cacheKey, content, expiresAfter);
    });
  };
}
