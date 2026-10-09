import nodemailer from "nodemailer";
import { logger } from "../lib/logger.js";
import { env } from "../config/env.js";

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

let transporter:
  | ReturnType<typeof nodemailer.createTransport>
  | undefined;

const isEmailEnabled = env.NOTIFICATION_EMAIL_ENABLED;

export const isEmailDeliveryEnabled = () => isEmailEnabled;

const getTransporter = () => {
  if (!isEmailEnabled) {
    return undefined;
  }

  if (transporter) {
    return transporter;
  }

  const { SMTP_HOST: host, SMTP_PORT: port, SMTP_SECURE: secure, SMTP_USER: user, SMTP_PASS: pass } = env;

  if (!host) {
    throw new Error("SMTP_HOST is required when email delivery is enabled");
  }

  if (!user) {
    throw new Error("SMTP_USER is required when email delivery is enabled");
  }

  if (!pass) {
    throw new Error("SMTP_PASS is required when email delivery is enabled");
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });

  return transporter;
};

export const verifyEmailTransport = async () => {
  const currentTransporter = getTransporter();

  if (!currentTransporter) {
    logger.info(
      { emailEnabled: false },
      "SMTP verification skipped",
    );

    return;
  }

  await currentTransporter.verify();

  logger.info("SMTP connection verified");
};

export const sendEmail = async ({
  to,
  subject,
  text,
  html,
}: SendEmailInput) => {
  const currentTransporter = getTransporter();

  if (!currentTransporter) {
    logger.info("Email delivery disabled; notification job skipped");
    return {
      skipped: true,
    };
  }

  const from = env.SMTP_FROM || env.SMTP_USER;

  if (!from) {
    throw new Error(
      "SMTP_FROM or SMTP_USER is required when email delivery is enabled",
    );
  }

  const result = await currentTransporter.sendMail({
    from,
    to,
    subject,
    text,
    ...(html ? { html } : {}),
  });

  logger.info({ messageId: result.messageId }, "Email sent");

  return {
    skipped: false,
    messageId: result.messageId,
  };
};