import { Router } from "express";
import {
  addComment,
  getComments,
} from "../controllers/comment.contoller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.post(
  "/incidents/:id/comments",
  authenticate,
  addComment
);

router.get(
  "/incidents/:id/comments",
  authenticate,
  getComments
);

export default router;