import { MailConfigurations } from "./types";

const defaultConfigurations: MailConfigurations = {
  secure: true,
  tls: true,
};

let mailConfigurations: MailConfigurations = {};

export function setMailConfigurations(config: MailConfigurations) {
  mailConfigurations = config;
}

export function getMailConfigurations(): MailConfigurations {
  return { ...defaultConfigurations, ...mailConfigurations };
}
