import { prisma } from "../lib/prisma.js";
import { publishIncidentCommentAdded } from "../realtime/publisher.js";
import { HttpError } from "../lib/http-error.js";

export const createComment = async(
    incidentId: string,
    userId : string,
    content : string
) =>{
    const incident = await prisma.incident.findUnique({
        where:{
            id: incidentId,
        },

    });

    if(!incident){
        throw new HttpError(404, "INCIDENT_NOT_FOUND", "Incident not found");
    }

    const comment = await prisma.$transaction(async(tx)=>{
        const comment = await tx.incidentComment.create({
            data:{
                content,
                incidentId,
                userId
            },
            include:{
                user:{
                    select:{
                        id:true,
                        name:true,
                        email:true
                    },

                },
            },
        });

        await tx.incidentEvent.create({
            data:{
                type:"COMMENT_ADDED",
                message: `${comment.user.name} added a comment`,
                incidentId,
                userId

            }
        });
        return comment;
    });

    publishIncidentCommentAdded({
        incidentId,
        userId,
        commentId: comment.id,
    });

    return comment;
};

export const getIncidentComments = async(
    incidentId: string
) =>{
    return prisma.incidentComment.findMany({
        where:{
            incidentId,
        },
        include :{
            user:{
                select:{
                    id:true,
                    name:true,
                    email:true
                },
            },
        },
        orderBy:{
            createdAt:"asc"
        },
    });
};