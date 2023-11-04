import { except } from "@mongez/reinforcements";
import type { Request } from "./../request";
import { Response } from "./../response";

export type ResponseCache = {
  set: (key: string, value: any) => void;
  get: (key: string) => any;
  has: (key: string) => boolean;
  delete: (key: string) => void;
  clear: () => void;
};

export const responseCache = new Map<string, any>() as ResponseCache;

// TODO: Add option to determine whether to cache the response or not
// TODO: add option to determine what to be cached from the response

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
   * Cache tags that would be used to clear the cache
   */
  tags?: string[];
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
    } = await parseCacheOptions(responseCacheOptions, request);

    const content = responseCache.get(cacheKey);
    console.log(cacheKey, content);

    if (content) {
      const output = content.data;

      return response.baseResponse.send(output);
    }

    if (expiresAfter) {
      response.onSending((response: Response) => {
        response.header("Cache-Control", `max-age=${expiresAfter}`);
      });
    }

    response.onSent((response: Response) => {
      if (response.statusCode > 299 || response.request.path !== request.path) {
        return;
      }

      const content = {
        data: except(response.body, omit),
      };

      responseCache.set(cacheKey, content);

      console.log(responseCache);
    });
  };
}
