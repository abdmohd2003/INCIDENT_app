import { Request, Response, NextFunction } from "express";
import {
    createIncident,
    getIncidents,
    getIncidentById,
    updateIncident,
    transitionIncidentStatus,
    assignIncident

} from "../services/incident.service.js";

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
    res:Response
) =>{
    try{
        const { status } = req.body;
        
        if (!status){
            return res.status(400).json({
                message:"status is required",

            });
        }
        const incident = await transitionIncidentStatus(
            String(req.params.id),
            status,
            req.user!.id
        );
        return res.status(200).json({
            message:"incident status updated",
            incident
        });

    } catch (error:any){
        console.log(error);

        if(error.message ===   "INCEDENT_NOT_FOUND"){
            return res.status(404).json({
                message:"Incident not found"
            });
        }

        if (error.message === "STATUS_ALREADY_SET" || error.message.includes("Invalid status transition")){
            return res.status(400).json({
                message:error.message,
            });
        }
        return res.status(500).json({
            message: "Failed to update incident status"
        });
    }

};


export const assignIncedentController = async(
    req: Request,
    res: Response

) =>{
    try {
        const {userId} = req.body;

        if(!userId){
            return res.status(400).json({
                message:"user id is required",
            });
        }

        const incident = await assignIncident(
            String(req.params.id),
            userId,
            req.user!.id 
        );
        return res.status(200).json({
            message: "Incident assigned successfully",
            incident
        });
    } catch (error:any){
        console.error(error);

        if(error.message === "INCIDENT_NOT_FOUND"){
            return res.status(404).json({
                message: "Incident not found",
            });
        }

        if(error.message === "USER_NOT_FOUND"){
            return res.status(404).json({
                message:"User not found"
            });

        }
        return res.status(500).json({
            message: "Failed to assign Incident"
        });
    }
};