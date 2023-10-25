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
};

const defaultCacheOptions: Partial<CacheMiddlewareOptions> = {
  withLocale: true,
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
  };

  if (finalCacheOptions.withLocale) {
    const locale = request.getLocaleCode();

    finalCacheOptions.cacheKey = `${finalCacheOptions.cacheKey}:${locale}`;
  }

  return {
    ...defaultCacheOptions,
    ...cacheOptions,
  } as CacheMiddlewareOptions & {
    cacheKey: string;
  };
}

export function cacheMiddleware(
  responseCacheOptions:
    | CacheMiddlewareOptions
    | CacheMiddlewareOptions["cacheKey"],
) {
  return async function (request: Request, response: Response) {
    const { cacheKey } = await parseCacheOptions(responseCacheOptions, request);

    const content = responseCache.get(cacheKey);

    if (content) {
      const output = content?.data || content;

      delete output.user;

      return response.baseResponse.send(output);
    }

    Response.on("sent", (response: Response) => {
      if (response.statusCode > 299 || response.request.path !== request.path) {
        return;
      }

      responseCache.set(cacheKey, response.body);
    });
  };
}
