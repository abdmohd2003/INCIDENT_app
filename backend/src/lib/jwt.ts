import jwt, { type JwtPayload } from "jsonwebtoken";

import { env } from "../config/env.js";

export const generateToken = (userId: string, role: string): string =>
  jwt.sign(
    { userId, role },
    env.JWT_SECRET,
    {
      algorithm: "HS256",
      expiresIn: "1h",
    },
  );

export const verifyToken = (token: string): string | JwtPayload =>
  jwt.verify(token, env.JWT_SECRET, {
    algorithms: ["HS256"],
    clockTolerance: 5,
  });
