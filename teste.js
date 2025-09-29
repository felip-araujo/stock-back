import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

console.log(Object.keys(prisma));
