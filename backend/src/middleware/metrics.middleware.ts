import type { NextFunction, Request, Response } from "express";

import {
  httpRequestDuration,
  httpRequestsTotal,
} from "../lib/metrics.js";

export const measureHttpRequest = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.path === "/metrics") {
    next();
    return;
  }

  const startedAt = process.hrtime.bigint();

  res.once("finish", () => {
    const method = req.method;
    const route = req.route?.path
      ? `${req.baseUrl}${req.route.path}`
      : "__unmatched__";
    const statusCode = String(res.statusCode);
    const labels = { method, route, status_code: statusCode };
    const durationSeconds =
      Number(process.hrtime.bigint() - startedAt) / 1_000_000_000;

    httpRequestsTotal.inc(labels);
    httpRequestDuration.observe(labels, durationSeconds);
  });

  next();
};
