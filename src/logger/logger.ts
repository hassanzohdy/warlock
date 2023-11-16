import logger, { LogChannel } from "@mongez/logger";
import { environment } from "../utils";
import { LogConfigurations } from "./types";

export function setLogConfigurations(options: LogConfigurations) {
  // log configurations
  const channels: LogChannel[] = [];

  const env = environment();

  const envChannels = options[env as "development" | "production"]?.channels;
  const defaultChannels = options.channels;

  if (defaultChannels) {
    channels.push(...defaultChannels);
  }

  if (envChannels) {
    channels.push(...envChannels);
  }

  logger.configure({
    channels,
  });
}
