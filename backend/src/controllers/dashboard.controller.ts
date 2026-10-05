import type { NextFunction, Request, Response } from "express";
import { getDashboardStats } from "../services/dashboard.service.js";

export const getDashboardStatsController = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    return res.status(200).json(await getDashboardStats());
  } catch (error) {
    return next(error);
  }
};