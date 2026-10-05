// 

import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { validateQuery } from "../middleware/validate.middleware.js";
import { getIncidentsQuerySchema } from "../validation/incident.validation.js";
import { getIncidentEventsController } from "../controllers/timeline.controller.js";
import { getDashboardStatsController } from "../controllers/dashboard.controller.js";

import {
  changeIncedentStatus,
  createIncidentController,
  getIncidentByIdController,
  getIncidentsController,
  updateIncidentController,
  assignIncedentController
} from "../controllers/incident.controller.js";

const router = Router();

router.use(authenticate);

router.post("/", createIncidentController);
router.get("/", validateQuery(getIncidentsQuerySchema), getIncidentsController);
router.get("/stats", getDashboardStatsController);
router.get("/:id/events", getIncidentEventsController);
router.get("/:id", getIncidentByIdController);
router.put("/:id", updateIncidentController);
router.patch("/:id/status",authenticate,changeIncedentStatus);
router.patch("/:id/assign",assignIncedentController);

export default router;