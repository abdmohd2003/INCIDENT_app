import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../lib/jwt.js";
import { HttpError } from "../lib/http-error.js";

const roles = ["ADMIN", "RESPONDER", "VIEWER"] as const;
type UserRole = (typeof roles)[number];
const isUserRole = (role: string): role is UserRole =>
  roles.some((allowedRole) => allowedRole === role);

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    return next(new HttpError(401, "AUTHENTICATION_REQUIRED", "Authentication required"));
  }

  try {
    const decoded = verifyToken(authorization.slice("Bearer ".length));
    if (
      typeof decoded === "string" ||
      typeof decoded.userId !== "string" ||
      typeof decoded.role !== "string" ||
      !isUserRole(decoded.role)
    ) {
      return next(new HttpError(401, "INVALID_TOKEN", "Invalid authentication token"));
    }

    req.user = {
      id: decoded.userId,
      role: decoded.role,
    };
    return next();
  } catch {
    return next(
      new HttpError(401, "INVALID_TOKEN", "Invalid or expired authentication token"),
    );
  }
};
