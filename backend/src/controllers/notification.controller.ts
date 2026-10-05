import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export const getNotificationsController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).userId;

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch notifications",
    });
  }
};