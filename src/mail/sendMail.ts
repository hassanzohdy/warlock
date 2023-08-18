import nodemailer from "nodemailer";
import { Options } from "nodemailer/lib/mailer";
import React from "react";
import { getMailConfigurations } from "./config";
import { renderReactMail } from "./react-mail";
import { MailConfigurations } from "./types";

/**
 * Create new mailer instance
 */
export function newMailer(
  configurations: MailConfigurations = getMailConfigurations(),
) {
  const { auth, username, password, requireTLS, tls, ...config } =
    configurations;

  return nodemailer.createTransport({
    requireTLS: requireTLS ?? tls,
    ...config,
    auth: auth ?? {
      user: username,
      pass: password,
    },
  });
}

/**
 * Send mail
 */
export async function sendMail(options: Options & Partial<MailConfigurations>) {
  return newMailer(options).sendMail({
    from: parseFrom(options),
    ...options,
  });
}

export async function sendReactMail(
  options: Omit<Options, "html"> & {
    render: React.ReactElement;
  } & Partial<MailConfigurations>,
) {
  return sendMail({
    ...options,
    html: renderReactMail(options.render),
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
