import { prisma } from "../lib/prisma.js";

export const getAllUser = async () =>{
    return prisma.user.findMany({
        select:{
            id:true,
            name:true,
            email:true,
            role:true,
            createdAt:true
        },
        orderBy:{
            createdAt:"desc",
        },
    });
};


export const getUserById = async (id:string) =>{
    return prisma.user.findUnique({
        where:{
            id,
        },
        select:{
            id:true,
            name:true,
            email:true,
            role:true,
            createdAt:true
        },
    });
};