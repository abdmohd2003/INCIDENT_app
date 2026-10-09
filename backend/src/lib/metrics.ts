import {
  collectDefaultMetrics,
  Counter,
  Gauge,
  Histogram,
  Registry,
} from "prom-client";

export const metricsRegistry = new Registry();

collectDefaultMetrics({
  register: metricsRegistry,
  prefix: "incident_api_",
});

export const httpRequestsTotal = new Counter({
  name: "incident_api_http_requests_total",
  help: "Completed HTTP requests.",
  labelNames: ["method", "route", "status_code"] as const,
  registers: [metricsRegistry],
});

export const httpRequestDuration = new Histogram({
  name: "incident_api_http_request_duration_seconds",
  help: "HTTP request duration in seconds.",
  labelNames: ["method", "route", "status_code"] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [metricsRegistry],
});

export const dependencyReady = new Gauge({
  name: "incident_api_dependency_ready",
  help: "Whether a dependency passed its most recent readiness check.",
  labelNames: ["dependency"] as const,
  registers: [metricsRegistry],
});

export const queueJobs = new Gauge({
  name: "incident_api_notification_queue_jobs",
  help: "Notification jobs by BullMQ state at the last readiness check.",
  labelNames: ["state"] as const,
  registers: [metricsRegistry],
});

export const websocketConnections = new Gauge({
  name: "incident_api_websocket_connections",
  help: "Currently connected authenticated Socket.IO clients.",
  registers: [metricsRegistry],
});
