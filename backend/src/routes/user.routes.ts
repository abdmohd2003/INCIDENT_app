import { Router } from "express";
import { getUser , getUsers } from "../controllers/user.controller.js"
import { authenticate } from "../middleware/auth.middleware.js";
import { validateParams } from "../middleware/validate.middleware.js";
import { userIdParamsSchema } from "../validation/incident.validation.js";


const router = Router();

router.get(
    "/",
    authenticate,
    getUsers
)

router.get(
    "/:id",
    authenticate,
    validateParams(userIdParamsSchema),
    getUser,
)


export default router;
