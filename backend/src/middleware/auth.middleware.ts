import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/jwt.js";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token) as { userId?: string; role?: string };

    if (!decoded || typeof decoded === "string" || !decoded.userId) {
      return res.status(401).json({
        message: "Invalid or expired token",
      });
    }

    req.user = {
      id: decoded.userId,
      role: decoded.role ?? "RESPONDER",
    };
    console.log("Auth user:",req.user);
    next();
  } catch {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};