import express from "express";
import cors from "cors";
import helmet from "helmet";

import { env, isAllowedOrigin } from "./config/env.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { requestLogger } from "./middleware/request-logging.middleware.js";
import { measureHttpRequest } from "./middleware/metrics.middleware.js";
import { apiRateLimit } from "./middleware/rate-limit.middleware.js";
import { metrics, metricsAuth, live, ready } from "./controllers/health.controller.js";
import userRoutes from "./routes/user.routes.js";
import incidentRoutes from "./routes/incident.routes.js";
import authRoutes from "./routes/auth.routes.js";
import commentRoutes from "./routes/comment.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import { HttpError } from "./lib/http-error.js";

const app = express();

app.set("trust proxy", env.TRUST_PROXY);
app.use(requestLogger);
app.use(measureHttpRequest);
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(new HttpError(403, "ORIGIN_NOT_ALLOWED", "Origin is not allowed"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type", "X-Request-Id"],
    maxAge: 600,
  }),
);
app.use(express.json({ limit: "1mb", strict: true }));

app.get("/", (_req, res) => {
  res.json({ message: "Incident Management API is running" });
});

app.get("/health", live);
app.get("/health/live", live);
app.get("/health/ready", ready);
app.get("/metrics", metricsAuth, metrics);

app.use("/api/v1", apiRateLimit);
app.use("/api/v1/incidents", incidentRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1", commentRoutes);
app.use("/api/v1/notifications", notificationRoutes);

app.use(errorHandler);

export default app;
