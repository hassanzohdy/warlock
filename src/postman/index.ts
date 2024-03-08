import { Command } from "commander";
import { Postman } from "./postman-generator";

export * from "./postman-generator";
export * from "./types";

export async function generatePostman() {
  const postman = new Postman();

  await postman.generate();
}

export function registerPostmanCommand() {
  return new Command("postman").action(async () => {
    await generatePostman();
  });
}
