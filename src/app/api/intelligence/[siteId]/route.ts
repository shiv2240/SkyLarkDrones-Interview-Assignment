import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { IntelligenceService } from "@/lib/services/intelligence.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ siteId: string }> },
) {
  const user = getAuthUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { siteId } = await params;
    const data = await IntelligenceService.synthesize(siteId);
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Intelligence API Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to synthesize intelligence" },
      { status: 500 },
    );
  }
}
