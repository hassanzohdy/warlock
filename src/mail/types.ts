import SMTPTransport from "nodemailer/lib/smtp-transport";

export type MailConfigurations = SMTPTransport.Options & {
  tls?: boolean;
  username?: string;
  password?: string;
  from?: {
    name: string;
    address: string;
  };
};
