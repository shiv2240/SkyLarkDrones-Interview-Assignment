import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: Request) {
  const user = getAuthUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sites = await prisma.site.findMany({
      where: { organizationId: user.orgId },
    });
    return NextResponse.json(sites);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to fetch sites" },
      { status: 500 },
    );
  }
}
