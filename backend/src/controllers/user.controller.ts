import { Request, Response } from "express";
import { getAllUser, getUserById } from "../services/user.service.js";

export const getUsers = async (
    req: Request,
    res: Response
) => {
    try {
        const users = await getAllUser();

        return res.status(200).json({
            users
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Failed to reach servers"
        });

    }
};

export const getUser = async (
    req: Request,
    res: Response
) => {
    try {
        const { id } = req.params;

        if (typeof id !== "string") {
            return res.status(400).json({
                message: "Invalid user ID",
            });
        }

        const user = await getUserById(id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        return res.status(200).json({
            user,
        })

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Failed to fetch user"
        })
    }
}