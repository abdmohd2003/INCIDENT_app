import { Router } from "express";
import {
  addComment,
  getComments,
} from "../controllers/comment.contoller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import { validateBody, validateParams } from "../middleware/validate.middleware.js";
import { commentBodySchema, incidentIdParamsSchema } from "../validation/incident.validation.js";

const router = Router();

router.post(
  "/incidents/:id/comments",
  authenticate,
  authorize("ADMIN", "RESPONDER"),
  validateParams(incidentIdParamsSchema),
  validateBody(commentBodySchema),
  addComment
);

router.get(
  "/incidents/:id/comments",
  authenticate,
  validateParams(incidentIdParamsSchema),
  getComments
);

export default router;