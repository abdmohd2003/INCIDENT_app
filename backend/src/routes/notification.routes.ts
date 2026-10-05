import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { getNotificationsController } from "../controllers/notification.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", getNotificationsController);

export default router;