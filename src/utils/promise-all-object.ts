/**
 * Resolve all of the given promises in the object and return the results as an object.
 * This is more convenient than using `Promise.all` and then mapping the results back to the keys.
 */
export async function promiseAllObject<T extends Record<string, Promise<any>>>(
  promises: T,
): Promise<{ [K in keyof T]: T[K] extends Promise<infer U> ? U : never }> {
  const results = await Promise.all(Object.values(promises));
  const keys = Object.keys(promises);

  return keys.reduce(
    (result, key, index) => {
      (result as any)[key] = results[index];
      return result;
    },
    {} as { [K in keyof T]: T[K] extends Promise<infer U> ? U : never },
  );
}
