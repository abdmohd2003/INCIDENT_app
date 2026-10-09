import "dotenv/config";

import { createServer } from "node:http";

import { env } from "./config/env.js";
import app from "./app.js";
import { closeSocket, initializeSocket } from "./realtime/socket.js";
import { logger } from "./lib/logger.js";
import { prisma } from "./lib/prisma.js";
import { rateLimitRedis } from "./lib/redis.js";
import { notificationQueue } from "./queues/notification.queue.js";

const server = createServer(app);
initializeSocket(server);

server.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "Incident API listening");
});

let shuttingDown = false;

const shutdown = async (signal: string) => {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, "API shutdown started");

  try {
    await closeSocket();
    if (server.listening) {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
    await notificationQueue.close();
    await rateLimitRedis.quit();
    await prisma.$disconnect();
    logger.info("API shutdown complete");
    process.exit(0);
  } catch (error) {
    logger.fatal({ err: error }, "API shutdown failed");
    process.exit(1);
  }
};

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
