import { Router } from "express";
import { getUser , getUsers } from "../controllers/user.controller.js"
import { authenticate } from "../middleware/auth.middleware.js";


const router = Router();

router.get(
    "/",
    authenticate,
    getUsers
)

router.get(
    "/:id",
    authenticate,
    getUser,
)


export default router;
