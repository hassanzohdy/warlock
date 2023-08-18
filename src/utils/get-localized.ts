import { requestContext } from "../http";

export function getLocalized(values: any[], localeCode?: string) {
  if (!values) return values;

  if (!localeCode) {
    localeCode = requestContext().request?.getLocaleCode();
  }

  if (Array.isArray(values)) {
    return values.find(value => value.localeCode === localeCode)?.value;
  }

  return values;
}
