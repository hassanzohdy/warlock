import nodemailer from "nodemailer";
import { Options } from "nodemailer/lib/mailer";
import { getMailConfigurations } from "./config";
import { MailConfigurations } from "./types";

let mailer: nodemailer.Transporter;

/**
 * Get mailer instance
 */
export function getMailer() {
  if (!mailer) {
    newMailer();
  }

  return mailer;
}

/**
 * Create new mailer instance
 */
export function newMailer(
  configurations: MailConfigurations = getMailConfigurations(),
) {
  const { auth, username, password, requireTLS, tls, ...config } =
    configurations;
  mailer = nodemailer.createTransport({
    requireTLS: requireTLS ?? tls,
    ...config,
    auth: auth ?? {
      user: username,
      pass: password,
    },
  });

  return mailer;
}

/**
 * Send mail
 */
export async function sendMail(options: Options) {
  return getMailer().sendMail({
    from: parseFrom(options),
    ...options,
  });
}

/**
 * Parse from
 */
function parseFrom(options: Options) {
  const from = options.from ?? getMailConfigurations().from;

  if (!from) return undefined;
  if (typeof from === "string") return from;

  return `${from.name} <${from.address}>`;
}
