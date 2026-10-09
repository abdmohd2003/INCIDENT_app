import type { NextFunction, Request, Response } from "express";
import {
    createComment,
    getIncidentComments
} from "../services/comment.service.js";

export const addComment = async (
    req:Request,
    res:Response,
    next: NextFunction,
)=>{
    try{
        const {content} = req.body;

        const comment = await createComment(
            String(req.params.id),
            req.user!.id,
            content,
        );

        return res.status(201).json({
            message:"comment added",
            comment,
        });

    }catch (error){
        next(error);

    }
};


export const getComments = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const comments = await getIncidentComments(
      String(req.params.id)
    );

    return res.status(200).json({
      comments,
    });
  } catch (error) {
    next(error);
  }
};