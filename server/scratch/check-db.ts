import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.count();
  const sites = await prisma.site.count();
  const incidents = await prisma.incident.count();
  const orgs = await prisma.organization.count();
  
  console.log({ users, sites, incidents, orgs });
  
  if (sites > 0) {
    const site = await prisma.site.findFirst();
    console.log("First Site:", site);
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
