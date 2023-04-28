import { requestContext } from "../http";

export function getLocalized(values: any[], localeCode?: string) {
  if (!values) return values;

  if (!localeCode) {
    const { request } = requestContext();

    localeCode = request.getLocaleCode();
  }

  if (Array.isArray(values)) {
    return values.find(value => value.localeCode === localeCode)?.value;
  }

  return values;
}
