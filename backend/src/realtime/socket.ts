import { Server as HttpServer } from "node:http";
import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";

interface AuthenticatedUser {
  id: string;
  role: string;
}

interface SocketData {
  user: AuthenticatedUser;
}

interface JwtPayload {
  userId: string;
  role?: string;
}

let io: SocketIOServer<
  Record<string, unknown>,
  Record<string, unknown>,
  Record<string, unknown>,
  SocketData
> | null = null;

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return secret;
};

const authenticateSocket = (socket: Socket) => {
  const token =
    socket.handshake.auth?.token ||
    socket.handshake.headers.authorization?.replace(/^Bearer\s+/i, "");

  if (!token) {
    throw new Error("Authentication token is required");
  }

  const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;

  if (!decoded.userId) {
    throw new Error("Invalid authentication token");
  }

  return {
    id: decoded.userId,
    role: decoded.role ?? "RESPONDER",
  };
};

export const initializeSocket = (httpServer: HttpServer) => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const user = authenticateSocket(socket);

      socket.data.user = user;

      next();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Authentication failed";

      next(new Error(message));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;

    console.log(`WebSocket connected: ${socket.id} (${user.id})`);

    socket.join(`user:${user.id}`);

    socket.on("disconnect", (reason) => {
      console.log(
        `WebSocket disconnected: ${socket.id} (${user.id}) - ${reason}`,
      );
    });

    socket.on("error", (error) => {
      console.error(`WebSocket error: ${socket.id}`, error);
    });
  });

  console.log("WebSocket server initialized");

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("WebSocket server has not been initialized");
  }

  return io;
};