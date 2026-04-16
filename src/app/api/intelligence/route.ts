import { NextResponse } from "next/server";
import { INCIDENTS, STORYLINES, EMPLOYEES, DroneResult } from "@/lib/data";

// ─── GET /api/intelligence ───────────────────────────────────────────────────
// Returns the full pre-computed AI intelligence package for the UI to render.
// In production: this would trigger the LangGraph agent run, check its cached
// result in PostgreSQL, and return that. Here we simulate the output.
export async function GET() {
  const totalSignals = INCIDENTS.length;
  const routine = INCIDENTS.filter((i) => i.type === "ROUTINE_PATROL").length;
  const critical = STORYLINES.filter((s) => s.risk === "critical").length;
  const needsReview = STORYLINES.filter((s) => s.status === "NEEDS_REVIEW").length;

  return NextResponse.json({
    generated_at: "2024-11-15T05:30:00Z",
    operator: "Maya Krishnan",
    site: "Horizon Industrial Park – Bangalore South",
    total_signals: totalSignals,
    routine_signals: routine,
    anomalous_signals: totalSignals - routine,
    critical_count: critical,
    needs_review_count: needsReview,
    greeting:
      `Good morning, Maya. I processed ${totalSignals} overnight signals from 22:00 to 06:00 and identified ` +
      `${STORYLINES.length} storylines for your review. ${critical} require immediate attention before the 8:00 AM brief.`,
    storylines: STORYLINES,
    incidents: INCIDENTS,
  });
}

// ─── MCP Tool: POST /api/intelligence?action=drone ──────────────────────────
// Simulates a drone dispatch & recon. In production, this would call the
// real drone routing microservice. Here we return probabilistic mock data.
export async function POST(request: Request) {
  const body = await request.json();
  const { action, storyline_id } = body;

  if (action === "dispatch_drone") {
    // Simulate 2.5s drone flight latency
    await new Promise((resolve) => setTimeout(resolve, 2500));

    const droneResults: Record<string, DroneResult> = {
      "STY-001": {
        report:
          "Drone thermal scan of Block C service road complete. Single white utility van (partial plate: KA-05) confirmed stationary near Maintenance Hatch 3. No unauthorized personnel visible outside the vehicle. Maintenance access panel appears to be open. Consistent with an emergency pipe inspection.",
        imageSrc: "/drone-sim-blockc.svg",
        thermal_anomaly: false,
        personnel_detected: 0,
        vehicles_detected: 1,
        confidence: "high",
      },
      "STY-002": {
        report:
          "Drone recon of Gate 7 perimeter complete. No personnel or ground vehicles detected. Airspace scan at 50m radius returned clear. PIR trigger may have been caused by thermal updraft or large avian. No structural breach of perimeter fence detected.",
        imageSrc: "/drone-sim-gate7.svg",
        thermal_anomaly: false,
        personnel_detected: 0,
        vehicles_detected: 0,
        confidence: "medium",
      },
    };

    const result = droneResults[storyline_id] ?? {
      report: "Drone scan complete. No anomalies detected in target zone.",
      imageSrc: "",
      thermal_anomaly: false,
      personnel_detected: 0,
      vehicles_detected: 0,
      confidence: "high" as const,
    };

    return NextResponse.json({ success: true, result });
  }

  if (action === "lookup_employee") {
    const { badge_id } = body;
    await new Promise((resolve) => setTimeout(resolve, 300));
    const employee = EMPLOYEES[badge_id] ?? null;
    return NextResponse.json({ success: true, employee });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
