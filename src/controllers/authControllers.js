import prisma from "../services/prismaClient.js"

export const auth = (req, res) => {
    
    prisma.user.create()
}