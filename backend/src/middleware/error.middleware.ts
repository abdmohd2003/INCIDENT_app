import type { ErrorRequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import { logger } from "../lib/logger.js";
import { HttpError } from "../lib/http-error.js";
import { Sentry } from "../lib/sentry.js";

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  req,
  res,
  _next,
) => {
  if (res.headersSent) {
    _next(error);
    return;
  }

  const requestId = String(res.getHeader("X-Request-Id") ?? "unknown");
  let statusCode = 500;
  let code = "INTERNAL_SERVER_ERROR";
  let message = "Internal server error";
  let details: unknown;

  if (error instanceof HttpError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
    details = error.details;
  } else if (error instanceof ZodError) {
    statusCode = 400;
    code = "VALIDATION_ERROR";
    message = "Request validation failed";
    details = error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      statusCode = 404;
      code = "RESOURCE_NOT_FOUND";
      message = "Resource not found";
    } else if (error.code === "P2002") {
      statusCode = 409;
      code = "RESOURCE_CONFLICT";
      message = "A resource with these values already exists";
    } else if (error.code === "P2003") {
      statusCode = 400;
      code = "INVALID_RELATION";
      message = "A related resource is invalid";
    } else {
      code = "DATABASE_ERROR";
      message = "Database operation failed";
    }
  } else if (
    error instanceof SyntaxError &&
    "status" in error &&
    error.status === 400
  ) {
    statusCode = 400;
    code = "INVALID_JSON";
    message = "Request body contains invalid JSON";
  }

  const requestLogger = req.log ?? logger;
  const log =
    statusCode >= 500
      ? requestLogger.error.bind(requestLogger)
      : requestLogger.warn.bind(requestLogger);
  log(
    {
      err: error,
      requestId,
      statusCode,
      code,
    },
    "Request failed",
  );

  if (statusCode >= 500 && error instanceof Error) {
    Sentry.captureException(error, {
      tags: { requestId, errorCode: code },
      extra: { method: req.method, path: req.path },
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    error: {
      code,
      message,
      requestId,
      ...(details === undefined ? {} : { details }),
    },
  });
};
