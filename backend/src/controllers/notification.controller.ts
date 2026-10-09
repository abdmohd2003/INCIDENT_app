import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export const getNotificationsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId: req.user!.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(notifications);
  } catch (error) {
    next(error);
  }
};