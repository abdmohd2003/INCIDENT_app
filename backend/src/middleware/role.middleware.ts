import { Request, Response, NextFunction } from "express";

export const authorize = (...allowedRoles: string[])=>(
    req:Request, res:Response, next:NextFunction
)=>{
   if(!req.user){
    return res.status(401).json({
        message:"Authentication required"
    });

   }

   const userRole = req.user.role;

   if(!userRole || !allowedRoles.includes(userRole)){
    return res.status(403).json({
        message:"you are not authorized to perform this action"
    })
   }
   next();
   
}