import { Request, Response } from "express";
import {
    createComment,
    getIncidentComments
} from "../services/comment.service.js";

export const addComment = async (
    req:Request,
    res:Response
)=>{
    try{
        const {content} = req.body;

        if (!content || !content.trim()){
            return res.status(400).json({
                message: "Comment content is required"
            });
        }

        const comment = await createComment(
            String(req.params.id),
            req.user!.id,
            content.trim()
        );

        return res.status(201).json({
            message:"comment added",

        });

    }catch (error:any){
        console.error(error);

        if(error.message === "INCIDENT_NOT_FOUND"){
            return res.status(404).json({
                message:"Incident not found"
            });
        }

        return res.status(500).json({
            message:"Failed to add comment"
        });

    }
};


export const getComments = async (
  req: Request,
  res: Response
) => {
  try {
    const comments = await getIncidentComments(
      String(req.params.id)
    );

    return res.status(200).json({
      comments,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to fetch comments",
    });
  }
};