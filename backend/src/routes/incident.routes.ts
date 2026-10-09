// 

import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import { validateQuery } from "../middleware/validate.middleware.js";
import { validateBody, validateParams } from "../middleware/validate.middleware.js";
import {
  assignIncidentBodySchema,
  createIncidentBodySchema,
  getIncidentsQuerySchema,
  incidentIdParamsSchema,
  incidentStatusBodySchema,
  updateIncidentBodySchema,
} from "../validation/incident.validation.js";
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

router.post(
  "/",
  authorize("ADMIN", "RESPONDER"),
  validateBody(createIncidentBodySchema),
  createIncidentController,
);
router.get("/", validateQuery(getIncidentsQuerySchema), getIncidentsController);
router.get("/stats", getDashboardStatsController);
router.get("/:id/events", validateParams(incidentIdParamsSchema), getIncidentEventsController);
router.get("/:id", validateParams(incidentIdParamsSchema), getIncidentByIdController);
router.put(
  "/:id",
  authorize("ADMIN", "RESPONDER"),
  validateParams(incidentIdParamsSchema),
  validateBody(updateIncidentBodySchema),
  updateIncidentController,
);
router.patch(
  "/:id/status",
  authorize("ADMIN", "RESPONDER"),
  validateParams(incidentIdParamsSchema),
  validateBody(incidentStatusBodySchema),
  changeIncedentStatus,
);
router.patch(
  "/:id/assign",
  authorize("ADMIN", "RESPONDER"),
  validateParams(incidentIdParamsSchema),
  validateBody(assignIncidentBodySchema),
  assignIncedentController,
);

export default router;