import type { Request, Response, NextFunction } from "express";
import { HttpError } from "../lib/http-error.js";

export const authorize =
  (...allowedRoles: Array<"ADMIN" | "RESPONDER" | "VIEWER">) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new HttpError(401, "AUTHENTICATION_REQUIRED", "Authentication required"));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new HttpError(403, "FORBIDDEN", "You are not authorized to perform this action"));
      return;
    }

    next();
  };