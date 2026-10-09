import { Router } from "express";
import {
    register,
    login 
} from "../controllers/auth.controller.js";
import { loginRateLimit } from "../middleware/rate-limit.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { loginBodySchema, registerBodySchema } from "../validation/incident.validation.js";

const router = Router();

router.post("/register", validateBody(registerBodySchema), register);
router.post("/login", loginRateLimit, validateBody(loginBodySchema), login);

export default router;