import { isIterable, isPlainObject, isScalar } from "@mongez/supportive-is";

export async function toJson(value: any): Promise<any> {
  // if it is a falsy value, return it
  if (!value || isScalar(value)) return value;

  // if it has a `toJSON` method, call it and await the result then return it
  if (value.toJSON) {
    return await value.toJSON();
  }

  // if it is iterable, an array or array-like object then parse each item
  if (isIterable(value)) {
    const values = Array.from(value);

    return Promise.all(
      values.map(async (item: any) => {
        return await toJson(item);
      }),
    );
  }

  // if not plain object, then return it
  if (!isPlainObject(value)) {
    return value;
  }

  // loop over the object and check if the value and call `parse` on it
  for (const key in value) {
    const subValue = value[key];

    value[key] = await toJson(subValue);
  }

  return value;
}
