import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

import { HttpError } from "../lib/http-error.js";

type RequestPart = "body" | "query" | "params";

const validatePart = (part: RequestPart, schema: ZodType) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[part]);

    if (!result.success) {
      next(
        new HttpError(
          400,
          "VALIDATION_ERROR",
          `Invalid request ${part}`,
          result.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        ),
      );
      return;
    }

    if (part === "body") req.body = result.data;
    res.locals[part === "query" ? "validatedQuery" : `validated${part[0].toUpperCase()}${part.slice(1)}`] =
      result.data;
    next();
  };

export const validateBody = (schema: ZodType) =>
  validatePart("body", schema);

export const validateParams = (schema: ZodType) =>
  validatePart("params", schema);

export const validateQuery = (schema: ZodType) =>
  validatePart("query", schema);
