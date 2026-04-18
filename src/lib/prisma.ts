import { PrismaClient } from "@prisma/client";
import path from "path";

const prismaClientSingleton = () => {
  // On Vercel, we need to use the absolute path to the SQLite file
  // so that the serverless function can find it.
  const isVercel = process.env.VERCEL === "1";
  const dbPath = isVercel 
    ? `file:${path.join(process.cwd(), "prisma", "dev.db")}`
    : null;

  // Only override datasources if we have a specific path (Vercel)
  // Otherwise, let Prisma use the default from schema.prisma
  return new PrismaClient(
    dbPath
      ? {
          datasources: {
            db: {
              url: dbPath,
            },
          },
        }
      : undefined
  );
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
