import {
  ensureDirectoryAsync,
  getJsonFileAsync,
  putJsonFileAsync,
  removeDirectoryAsync,
} from "@mongez/fs";
import { GenericObject } from "@mongez/reinforcements";
import path from "path";
import { CacheDriver, FileCacheOptions } from "../types";
import { BaseCacheDriver } from "./base-cache-driver";

export class FileCacheDriver
  extends BaseCacheDriver<FileCacheDriver, FileCacheOptions>
  implements CacheDriver<FileCacheDriver, FileCacheOptions>
{
  /**
   * {@inheritdoc}
   */
  public name = "file";

  /**
   * Get the cache directory
   */
  public get directory() {
    const directory = this.options.directory;

    if (typeof directory === "function") {
      return directory();
    }

    throw new Error(
      "Cache directory is not defined, please define it in the file driver options",
    );
  }

  /**
   * Get file name
   */
  public get fileName() {
    const fileName = this.options.fileName;

    if (typeof fileName === "function") {
      return fileName();
    }

    return "cache.json";
  }

  /**
   * {@inheritdoc}
   */
  public async removeNamespace(namespace: string) {
    this.log("cleared", namespace);

    try {
      await removeDirectoryAsync(path.resolve(this.directory, namespace));

      this.log("cleared", namespace);
    } catch (error) {
      //
    }

    return this;
  }

  /**
   * {@inheritdoc}
   */
  public async set(key: string | GenericObject, value: any, ttl?: number) {
    key = this.parseKey(key);

    this.log("caching", key);

    const data = this.prepareDataForStorage(value, ttl);

    const fileDirectory = path.resolve(this.directory, key);

    await ensureDirectoryAsync(fileDirectory);

    await putJsonFileAsync(path.resolve(fileDirectory, this.fileName), data);

    this.log("cached", key);

    return this;
  }

  /**
   * {@inheritdoc}
   */
  public async get(key: string | GenericObject) {
    const parsedKey = this.parseKey(key);

    this.log("fetching", parsedKey);

    const fileDirectory = path.resolve(this.directory, parsedKey);

    try {
      const value = await getJsonFileAsync(
        path.resolve(fileDirectory, this.fileName),
      );

      return this.parseCachedData(parsedKey, value);
    } catch (error) {
      this.log("notFound", parsedKey);
      this.remove(key);
      return null;
    }
  }

  /**
   * {@inheritdoc}
   */
  public async remove(key: string | GenericObject) {
    const parsedKey = this.parseKey(key);
    this.log("removing", parsedKey);

    const fileDirectory = path.resolve(this.directory, parsedKey);

    try {
      await removeDirectoryAsync(fileDirectory);

      this.log("removed", parsedKey);
    } catch (error) {
      //
    }
  }

  /**
   * {@inheritdoc}
   */
  public async flush() {
    this.log("flushing");

    if (this.options.globalPrefix) {
      await this.removeNamespace("");
    } else {
      await removeDirectoryAsync(this.directory);
    }

    this.log("flushed");
  }

  /**
   * {@inheritdoc}
   */
  public async connect() {
    this.log("connecting");
    await ensureDirectoryAsync(this.directory);
    this.log("connected");
  }
}
