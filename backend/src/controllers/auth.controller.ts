import { Request, Response } from "express";
import {
  registerUser,
  loginUser,
} from "../services/auth.service.js";

export const register = async (
  req: Request,
  res: Response
) => {
  try {
    const {name, email, password } = req.body;

    const result = await registerUser(name,email, password);

    return res.status(201).json(result);
  } catch (error: any) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

export const login = async (
  req: Request,
  res: Response
) => {
  try {
    const { email, password } = req.body;

    const result = await loginUser(email, password);

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(401).json({
      message: error.message,
    });
  }
};