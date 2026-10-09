import { Request, Response, NextFunction } from "express";
import {
    createIncident,
    getIncidents,
    getIncidentById,
    updateIncident,
    transitionIncidentStatus,
    assignIncident

} from "../services/incident.service.js";
import { HttpError } from "../lib/http-error.js";

export const createIncidentController = async (
    req:Request,
    res:Response,
    next:NextFunction 
) =>{
    try{
        const incident = await createIncident(req.user!.id, req.body)
        res.status(201).json(incident)
    } catch (error) {
        next(error)
    }
}



export const getIncidentsController = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await getIncidents(
      res.locals.validatedQuery
    );

    return res.status(200).json({
      success: true,
      data: result.incidents,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};


export const getIncidentByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);

    const incident = await getIncidentById(id);
    if (!incident) {
      throw new HttpError(404, "INCIDENT_NOT_FOUND", "Incident not found");
    }

    res.json(incident);
  } catch (error) {
    next(error);
  }
};



export const updateIncidentController = async(
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const id = String(req.params.id);
        const updateData = req.body;

        const incident = await updateIncident(id, req.user!.id, updateData);

        res.json(incident);
    } catch (error) {
        next(error);
    }
};


export const changeIncedentStatus = async (
    req: Request,
    res:Response,
    next: NextFunction,
) =>{
    try{
        const { status } = req.body;
        const incident = await transitionIncidentStatus(
            String(req.params.id),
            status,
            req.user!.id
        );
        return res.status(200).json({
            message:"incident status updated",
            incident
        });

    } catch (error){
        next(error);
    }

};


export const assignIncedentController = async(
    req: Request,
    res: Response,
    next: NextFunction,

) =>{
    try {
        const {userId} = req.body;

        const incident = await assignIncident(
            String(req.params.id),
            userId,
            req.user!.id 
        );
        return res.status(200).json({
            message: "Incident assigned successfully",
            incident
        });
    } catch (error){
        next(error);
    }
};