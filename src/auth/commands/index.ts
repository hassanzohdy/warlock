import { fileExists, getFile, putFile } from "@mongez/fs";
import { log } from "@mongez/logger";
import { Random } from "@mongez/reinforcements";
import { Command } from "commander";
import { rootPath } from "./../../utils/paths";

export function registerJWTSecretGenerator() {
  return new Command("jwt.secret").action(() => {
    let envFile = rootPath(".env");

    log.info("generating", "jwt", "Generating jwt secret");

    if (!fileExists(envFile)) {
      envFile = rootPath(".env.local");
    }

    if (!fileExists(envFile)) {
      log.error("generating", "jwt", ".env file not found");
      return;
    }

    let contents = getFile(envFile);

    if (contents.includes("JWT_SECRET")) return;

    const key = Random.string(32);

    contents += `
# JWT Secret
JWT_SECRET=${key}
`;

    putFile(envFile, contents);

    log.success(
      "generating",
      "jwt",
      `JWT secret key generated and added to the .env file.`,
    );
  });
}
