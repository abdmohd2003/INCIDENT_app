import type { NextFunction, Request, Response } from "express";
import { getIncidentEvents } from "../services/timeline.service.js";

export const getIncidentEventsController = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const events = await getIncidentEvents(String(req.params.id));
		return res.status(200).json({ events });
	} catch (error) {
		return next(error);
	}
};
