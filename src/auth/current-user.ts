import { requestContext } from "./../http";
import { Auth } from "./models/auth";

export function getCurrentUser<T = Auth | undefined>() {
  return requestContext().user as T;
}
