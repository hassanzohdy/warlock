/**
 * Resolve all of the given promises in the object and return the results as an object.
 * This is more convenient than using `Promise.all` and then mapping the results back to the keys.
 */
export async function promiseAllObject(promises: Record<string, Promise<any>>) {
  const results = await Promise.all(Object.values(promises));
  const keys = Object.keys(promises);

  return keys.reduce((result: any, key: string, index) => {
    result[key] = results[index];

    return result;
  }, {});
}
