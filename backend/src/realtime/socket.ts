import type { Server as HttpServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import jwt, { type JwtPayload } from "jsonwebtoken";

import { env, isAllowedOrigin } from "../config/env.js";
import { logger } from "../lib/logger.js";
import type { IncidentServerEvents } from "./events.js";

const roles = ["ADMIN", "RESPONDER", "VIEWER"] as const;
type Role = (typeof roles)[number];
const isRole = (role: unknown): role is Role =>
  typeof role === "string" && roles.some((allowedRole) => allowedRole === role);

interface AuthenticatedUser {
  id: string;
  role: Role;
}

interface SocketData {
  user: AuthenticatedUser;
}

let io: SocketIOServer<
  Record<string, never>,
  IncidentServerEvents,
  Record<string, never>,
  SocketData
> | null = null;

const authenticateSocket = (token: unknown): AuthenticatedUser => {
  if (typeof token !== "string" || !token) {
    throw new Error("Authentication token is required");
  }

  const decoded = jwt.verify(token, env.JWT_SECRET, {
    algorithms: ["HS256"],
  });

  if (
    typeof decoded === "string" ||
    typeof decoded.userId !== "string" ||
    !isRole(decoded.role)
  ) {
    throw new Error("Invalid authentication token");
  }

  return {
    id: decoded.userId,
    role: decoded.role,
  };
};

export const initializeSocket = (httpServer: HttpServer) => {
  io = new SocketIOServer<
    Record<string, never>,
    IncidentServerEvents,
    Record<string, never>,
    SocketData
  >(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error("Origin is not allowed"));
      },
      credentials: true,
    },
    allowRequest: (request, callback) => {
      const origin = request.headers.origin;
      callback(
        isAllowedOrigin(origin) ? null : "Origin is not allowed",
        isAllowedOrigin(origin),
      );
    },
  });

  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ??
        socket.handshake.headers.authorization?.replace(/^Bearer\s+/i, "");
      socket.data.user = authenticateSocket(token);
      next();
    } catch {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const { id, role } = socket.data.user;
    socket.join(`user:${id}`);
    logger.info(
      { socketId: socket.id, userId: id, role },
      "WebSocket client connected",
    );

    socket.on("disconnect", (reason) => {
      logger.info(
        { socketId: socket.id, userId: id, reason },
        "WebSocket client disconnected",
      );
    });
  });

  io.engine.on("connection_error", (error) => {
    logger.warn(
      { code: error.code, message: error.message },
      "WebSocket handshake failed",
    );
  });

  logger.info("Socket.IO server initialized");
  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO server has not been initialized");
  }
  return io;
};

export const getSocketHealth = () => ({
  initialized: io !== null,
  connectedClients: io?.engine.clientsCount ?? 0,
});

export const closeSocket = async () => {
  if (!io) return;
  const current = io;
  io = null;
  await new Promise<void>((resolve) => current.close(() => resolve()));
};
