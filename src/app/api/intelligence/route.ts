import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { SITES, DEFAULT_SITE_ID, Incident, Storyline } from "@/lib/data";

/**
 * 6:10 Assistant Intelligence Engine | Powered by Groq
 * Fast LLM inference with automated security narratives.
 */
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || "",
  baseURL: "https://api.groq.com/openai/v1",
});

// Simple in-memory cache for intelligence logic
const intelCache: Record<string, any> = {};

/**
 * Deterministic Fallback Synthesis
 * If the API is throttled or down, we still group signals logically.
 */
function localDeterministicSynthesis(siteId: string, incidents: Incident[]) {
  const site = SITES[siteId];
  const storylines: Storyline[] = [];
  
  const zoneGroups: Record<string, Incident[]> = {};
  incidents.forEach(inc => {
    if (!zoneGroups[inc.zone]) zoneGroups[inc.zone] = [];
    zoneGroups[inc.zone].push(inc);
  });

  Object.entries(zoneGroups).forEach(([zone, logs], idx) => {
    const isHarmless = logs.every(l => l.type === "ROUTINE_PATROL");
    storylines.push({
      id: `fallback-${idx}`,
      title: isHarmless ? `Routine Monitoring: ${zone}` : `Anomalous Activity: ${zone}`,
      zone: zone,
      risk: isHarmless ? "info" : "warning",
      confidence: "medium",
      confidence_pct: 75,
      hypothesis: isHarmless 
        ? `Routine patrol patterns confirmed in ${zone}. No deviations detected.`
        : `Multiple triggers (${logs.length}) identified in ${zone}. [Local Analysis Only]`,
      ai_recommendation: isHarmless ? "No action required." : "Dispatch drone to verify zone integrity.",
      agent_reasoning: [
        `Local grouping of ${logs.length} signals in ${zone}`,
        `Pattern match: ${isHarmless ? "Routine Patrol" : "Anomaly Detect"}`,
        "Note: Global Intelligence currently unavailable",
        "Grouping by spatial proximity"
      ],
      incident_ids: logs.map(l => l.id),
      lat: logs[0].lat,
      lng: logs[0].lng,
      status: isHarmless ? "HARMLESS" : "NEEDS_REVIEW"
    });
  });

  return {
    storylines,
    summary: "⬡ Using Local Security Analysis. Spatial patterns identified."
  };
}

async function synthesizeIntelligence(
  siteId: string,
  incidents: Incident[],
  raghavNote: string,
) {
  // We keep the cache check commented for active development but it's ready for prod
  // if (intelCache[siteId]) return intelCache[siteId];

  const prompt = `
    You are an AI Security Specialist for ${SITES[siteId]?.name}.
    It is 6:10 AM. You are reviewing the overnight log of ${incidents.length} raw signals.
    
    CRITICAL CONTEXT: "${raghavNote}"
    
    RAW SIGNALS:
    ${incidents.map((i) => `ID:${i.id} | Time:${i.timestamp} | Type:${i.type} | Zone:${i.zone} | Detail:${i.description}`).join("\n")}
    
    TASK:
    1. Group related signals into meaningful "Storylines".
    2. Identify "HARMLESS" events: Routine patrols or maintenance. Set status to "HARMLESS" and risk to "info".
    3. Identify "ANOMALIES": Unauthorized counts, fence alerts. Set status to "NEEDS_REVIEW" and risk to "warning" or "critical".
    
    IMPORTANT: For each storyline, provide 'agent_reasoning' that explains the precise correlation logic (e.g., "Matched Badge-ID with Sensor-ID within 120s window"). Surface any uncertainty in the 'confidence' field if signals are sparse.
    {
      "storylines": [
        {
          "id": "story-1",
          "title": "...",
          "zone": "...",
          "risk": "critical|warning|info",
          "confidence": "high|medium|low",
          "confidence_pct": 0-100,
          "hypothesis": "...",
          "ai_recommendation": "...",
          "agent_reasoning": ["step1", "step2", "step3", "step4"],
          "incident_ids": ["inc-1", "inc-2"],
          "lat": number,
          "lng": number,
          "status": "NEEDS_REVIEW|HARMLESS"
        }
      ],
      "summary": "Short 1-sentence greeting"
    }
  `;

  try {
    console.log(`[Groq] Synthesizing site: ${siteId} with Llama-3.3-70b`);
    
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are a professional security analyst. Always return valid JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const text = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(text);

    if (!parsed.storylines) throw new Error("Invalid intelligence schema");

    intelCache[siteId] = parsed;
    return parsed;
  } catch (err: any) {
    console.warn("Groq Synthesis Failed:", err?.message);
    return localDeterministicSynthesis(siteId, incidents);
  }
}

// ─── GET /api/intelligence ──────────────────────────────────────────────────
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get("site") || DEFAULT_SITE_ID;
  const site = SITES[siteId];

  if (!site) return NextResponse.json({ error: "Unknown site" }, { status: 400 });

  const { storylines, summary } = await synthesizeIntelligence(siteId, site.incidents, site.raghav_note);

  const total = site.incidents.length;
  const routine = site.incidents.filter((i) => i.type === "ROUTINE_PATROL").length;
  const critical = storylines.filter((s: any) => s.risk === "critical").length;

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    site_id: siteId,
    operator: site.operator,
    site: site.name,
    raghav_note: site.raghav_note,
    total_signals: total,
    routine_signals: routine,
    anomalous_signals: total - routine,
    critical_count: critical,
    needs_review_count: storylines.filter((s:any) => s.status === "NEEDS_REVIEW").length,
    center: site.center,
    droneNest: site.droneNest,
    zoom: site.zoom,
    greeting: summary,
    storylines,
    incidents: site.incidents,
    sites: Object.values(SITES).map((s) => ({ id: s.id, name: s.name, label: s.label, city: s.city })),
  });
}

// ─── POST /api/intelligence ──────────────────────────────────────────────────
export async function POST(request: Request) {
  const body = await request.json();
  const { action, storyline_id, site_id } = body;
  const site = SITES[site_id || DEFAULT_SITE_ID];

  if (action === "dispatch_drone") {
    await new Promise((resolve) => setTimeout(resolve, 2500));
    return NextResponse.json({ success: true, result: site.droneReconResults[storyline_id] || { report: "Area clear.", confidence: "high" } });
  }

  if (action === "lookup_employee") {
    return NextResponse.json({ success: true, employee: site.employees[body.badge_id] || null });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
