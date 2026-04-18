import { OpenAI } from "openai";
import { PrismaClient, Incident } from "@prisma/client";

const prisma = new PrismaClient();

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || "",
  baseURL: "https://api.groq.com/openai/v1",
});

export class IntelligenceService {
  /**
   * Deterministic Fallback Synthesis (Legacy logic ported)
   */
  static async localFallback(siteId: string, incidents: Incident[]) {
    const storylines = [];
    const zoneGroups: Record<string, Incident[]> = {};

    incidents.forEach((inc) => {
      if (!zoneGroups[inc.zone]) zoneGroups[inc.zone] = [];
      zoneGroups[inc.zone].push(inc);
    });

    for (const [zone, logs] of Object.entries(zoneGroups)) {
      const isHarmless = logs.every((l) => l.type === "ROUTINE_PATROL");
      storylines.push({
        id: `local-${zone}-${Date.now()}`,
        title: isHarmless
          ? `Routine Monitoring: ${zone}`
          : `Anomalous Activity: ${zone}`,
        zone: zone,
        risk: isHarmless ? "info" : "warning",
        confidence: "medium",
        confidencePct: 75,
        hypothesis: isHarmless
          ? `Routine patrol patterns confirmed in ${zone}. No deviations detected.`
          : `Multiple triggers identified in ${zone}. [Local Analysis Mode]`,
        aiRecommendation: isHarmless
          ? "No action required."
          : "Dispatch drone to verify zone integrity.",
        agentReasoning: JSON.stringify([
          `Local grouping of ${logs.length} signals in ${zone}`,
          "Reason: Global Intelligence engine unavailable",
        ]),
        incidentIds: logs.map((l) => l.id).join(","),
        lat: logs[0].lat,
        lng: logs[0].lng,
        status: isHarmless ? "HARMLESS" : "NEEDS_REVIEW",
        siteId,
      });
    }

    const anomalousCount = incidents.filter(
      (i) => i.type !== "ROUTINE_PATROL",
    ).length;
    const routineCount = incidents.length - anomalousCount;

    return {
      generated_at: new Date().toISOString(),
      site_id: siteId,
      total_signals: incidents.length,
      routine_signals: routineCount,
      anomalous_signals: anomalousCount,
      critical_count: storylines.filter((s) => s.risk === "critical").length,
      needs_review_count: storylines.filter((s) => s.status === "NEEDS_REVIEW")
        .length,
      storylines,
      incidents,
      summary: "Using Local Security Analysis. Spatial patterns identified.",
    };
  }

  static async synthesize(siteId: string) {
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      include: { incidents: true },
    });

    if (!site) throw new Error("Site not found");

    const prompt = `
      You are an AI Security Specialist for ${site.name}.
      RAW SIGNALS:
      ${site.incidents.map((i: Incident) => `ID:${i.id} | Time:${i.timestamp} | Type:${i.type} | Zone:${i.zone} | Detail:${i.description}`).join("\n")}
      
      TASK:
      1. Group signals into meaningful "Storylines".
      2. Identify HARMLESS (info) and ANOMALIES (warning|critical).
      
      Return as JSON:
      {
        "storylines": [
          {
            "title": "...", "zone": "...", "risk": "...", "confidence": "...", "confidencePct": 0-100,
            "hypothesis": "...", "aiRecommendation": "...", "agentReasoning": ["step1"],
            "incidentIds": ["id1"], "lat": 0, "lng": 0, "status": "NEEDS_REVIEW|HARMLESS"
          }
        ],
        "summary": "..."
      }
    `;

    try {
      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");

      // Ensure each storyline has a unique ID and normalized risk for React keys
      if (parsed.storylines) {
        parsed.storylines = parsed.storylines.map((s: any, idx: number) => {
          let risk = (s.risk || "info").toLowerCase();
          if (!["critical", "warning", "info"].includes(risk)) {
            risk = "warning";
          }

          // Force coordinates from the associated incidents
          const incidentIds = Array.isArray(s.incidentIds)
            ? s.incidentIds
            : (s.incidentIds || "").split(",");
          const matchingIncidents = site.incidents.filter((inc: any) =>
            incidentIds.includes(inc.id),
          );

          const lat =
            matchingIncidents.length > 0 ? matchingIncidents[0].lat : site.lat;
          const lng =
            matchingIncidents.length > 0 ? matchingIncidents[0].lng : site.lng;

          return {
            ...s,
            id: s.id || `ai-${siteId}-${idx}-${Date.now()}`,
            risk,
            lat,
            lng,
          };
        });
      }

      // Observability: Log the AI action
      await prisma.auditLog.create({
        data: {
          action: "AI_SYNTHESIS",
          operator: "SYSTEM",
          details: `Processed ${site.incidents.length} signals for site ${site.name}. Latency: ${response.usage?.total_tokens} tokens used.`,
          category: "AI",
        },
      });

      // Calculate metrics
      const anomalousCount = site.incidents.filter(
        (i: any) => i.type !== "ROUTINE_PATROL",
      ).length;
      const routineCount = site.incidents.length - anomalousCount;

      return {
        generated_at: new Date().toISOString(),
        site_id: site.id,
        operator: site.operator,
        site: site.name,
        raghav_note: site.raghavNote,
        total_signals: site.incidents.length,
        routine_signals: routineCount,
        anomalous_signals: anomalousCount,
        critical_count: parsed.storylines.filter(
          (s: any) => s.risk === "critical",
        ).length,
        needs_review_count: parsed.storylines.filter(
          (s: any) => s.status === "NEEDS_REVIEW",
        ).length,
        greeting: parsed.summary, // Use summary as greeting for now
        center: { lat: site.lat, lng: site.lng },
        droneNestLat: site.droneNestLat,
        droneNestLng: site.droneNestLng,
        zoom: site.zoom,
        storylines: parsed.storylines,
        incidents: site.incidents,
        summary: parsed.summary,
      };
    } catch (err: any) {
      console.warn("AI synthesis failed, falling back to local.");
      const fallback = await this.localFallback(siteId, site.incidents);
      return {
        ...fallback,
        operator: site.operator,
        site: site.name,
        raghav_note: site.raghavNote,
        greeting:
          "Local security protocols active. AI synchronization degraded.",
        center: { lat: site.lat, lng: site.lng },
        droneNestLat: site.droneNestLat,
        droneNestLng: site.droneNestLng,
        zoom: site.zoom,
      };
    }
  }
}
