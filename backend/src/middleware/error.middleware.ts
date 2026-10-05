import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error(error);

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        error: {
          message: "Resource not found",
        },
      });
    }

    return res.status(400).json({
      success: false,
      error: {
        message: "Database operation failed",
      },
    });
  }

  if (error instanceof Error) {
    return res.status(500).json({
      success: false,
      error: {
        message: error.message,
      },
    });
  }

  return res.status(500).json({
    success: false,
    error: {
      message: "Internal server error",
    },
  });
};