import {
  ensureDirectory,
  getJsonFile,
  putJsonFile,
  removeDirectory,
  unlinkAsync,
} from "@mongez/fs";
import { log } from "@mongez/logger";
import { trim } from "@mongez/reinforcements";
import { storagePath } from "../utils";
import { CacheDriver } from "./types";

export const cache = {
  exists: false,
  set: async (key: string, value: any) => {
    //
    const cacheKey = cache.parseKey(key);

    log.info("cache.file", "caching", cacheKey);

    const cacheDirectoryPath = storagePath("cache/" + cacheKey);

    ensureDirectory(cacheDirectoryPath);
    putJsonFile(cacheDirectoryPath + "/data.json", JSON.stringify(value));

    log.success("cache.file", "cached", cacheKey);
  },
  get: async (key: string) => {
    //
    const cacheKey = cache.parseKey(key);
    log.info("cache.file", "fetching", cacheKey);
    try {
      const data = getJsonFile(storagePath("cache/" + cacheKey + "/data.json"));

      log.success("cache.file", "fetched", cacheKey);

      return data;
    } catch (error) {
      log.info("cache.file", "not-found", cacheKey);
      return;
    }
  },
  async flush() {
    removeDirectory(storagePath("cache"));
  },
  remove(key: string) {
    //
    unlinkAsync(storagePath("cache/" + cache.parseKey(key) + "/data.json"));
  },
  connect: async () => {
    //
  },
  parseKey(key) {
    // make sure the key is a valid file path syntax using regex.
    // replace double dash or more with a single dash.
    // replace any . with / to make it a directory.
    return key
      .replace(/\./g, "/")
      .split("/")
      .map((part: string) =>
        trim(part.replace(/[^a-z0-9-/]/gi, "-").replace(/-+/g, "-"), "-"),
      )
      .join("/");
  },
  removeByNamespace(namespace: string) {
    //

    const cacheDirectoryPath = storagePath(
      "cache/" + cache.parseKey(namespace),
    );

    try {
      removeDirectory(cacheDirectoryPath);
    } catch (error) {
      //
      console.log(error);
    }
  },
} as CacheDriver<any, any> & {
  exists: boolean;
};

export function setCacheDriver(cacheDriver?: CacheDriver<any, any>) {
  Object.assign(cache, cacheDriver);
  cache.exists = !!cacheDriver;
}

export async function connectToCache() {
  await cache?.connect();
}
