import { Model } from "@mongez/monpulse";
import Password from "@mongez/password";

export function castPassword(value: any, column: string, model: Model) {
  return value
    ? Password.generate(String(value), 12)
    : model.getInitial(column);
}
