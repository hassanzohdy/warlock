import { Request } from "./../http";
import { Auth } from "./models/auth";

export function getCurrentUser<T = Auth | undefined>() {
  return Request.current?.user as T;
}
