// ─── Simulated Data Layer ───────────────────────────────────────────────────
// This file represents the "messy night" data seeder for the 6:10 AM demo.
// In production, this would be fetched from PostgreSQL / PostGIS.

export type IncidentType =
  | "FENCE_ALERT"
  | "BADGE_FAILURE"
  | "VEHICLE_MOTION"
  | "DRONE_SIGHTING"
  | "PERIMETER_BREACH"
  | "ROUTINE_PATROL";

export type ConfidenceLevel = "high" | "medium" | "low";
export type StorylineStatus = "NEEDS_REVIEW" | "APPROVED" | "DISCARDED" | "DRONE_DISPATCHED" | "DRONE_RETURNED";
export type RiskLevel = "critical" | "warning" | "info";

export interface Incident {
  id: string;
  type: IncidentType;
  timestamp: string; // ISO string
  lat: number;
  lng: number;
  zone: string;
  description: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface Employee {
  badge_id: string;
  name: string;
  department: string;
  shift: string;
  authorized_zones: string[];
  night_shift_approved: boolean;
}

export interface DroneResult {
  report: string;
  imageSrc: string; // a placeholder / simulated image tag
  thermal_anomaly: boolean;
  personnel_detected: number;
  vehicles_detected: number;
  confidence: ConfidenceLevel;
}

export interface Storyline {
  id: string;
  title: string;
  zone: string;
  lat: number;
  lng: number;
  risk: RiskLevel;
  status: StorylineStatus;
  hypothesis: string;
  confidence: ConfidenceLevel;
  confidence_pct: number;
  incident_ids: string[];
  ai_recommendation: string;
  drone_result?: DroneResult;
  approved_note?: string;
}

export interface MorningBriefing {
  generated_at: string;
  operator: string;
  site: string;
  summary: string;
  items: BriefingItem[];
}

export interface BriefingItem {
  storyline_id: string;
  zone: string;
  finding: string;
  action_taken: string;
  approved_by: string;
}

// ─── Mock Employee Directory ─────────────────────────────────────────────────
export const EMPLOYEES: Record<string, Employee> = {
  "BD-9942": {
    badge_id: "BD-9942",
    name: "Raghav Nair",
    department: "Facilities & Maintenance",
    shift: "Day (07:00–16:00)",
    authorized_zones: ["Workshop", "Utilities Block", "Gate 1"],
    night_shift_approved: false,
  },
  "BD-1102": {
    badge_id: "BD-1102",
    name: "Sanjana Mehta",
    department: "Security",
    shift: "Night (22:00–06:00)",
    authorized_zones: ["All Zones"],
    night_shift_approved: true,
  },
  "BD-4471": {
    badge_id: "BD-4471",
    name: "Arjun Pillai",
    department: "Logistics",
    shift: "Day (08:00–17:00)",
    authorized_zones: ["Dispatch Bay", "Parking Lot A"],
    night_shift_approved: false,
  },
};

// ─── Mock Incident Feed (the "messy night") ───────────────────────────────────
export const INCIDENTS: Incident[] = [
  // ── Storyline 1: Block C Unauthorized Access ─────────────────────────────
  {
    id: "INC-001",
    type: "FENCE_ALERT",
    timestamp: "2024-11-15T02:15:00Z",
    lat: 12.9716,
    lng: 77.5946,
    zone: "Block C – North Fence",
    description: "Fence vibration sensor triggered. 4 pulses detected over 12 seconds.",
    metadata: { sensor_id: "FEN-C-N-04", pulse_count: 4 },
  },
  {
    id: "INC-002",
    type: "BADGE_FAILURE",
    timestamp: "2024-11-15T02:17:33Z",
    lat: 12.9712,
    lng: 77.5951,
    zone: "Block C – Storage Entry",
    description: "Badge BD-9942 (Raghav Nair, Facilities) failed reader. Not on night roster.",
    metadata: { badge_id: "BD-9942", reader_id: "RDR-C-03", attempt_count: 3 },
  },
  {
    id: "INC-003",
    type: "VEHICLE_MOTION",
    timestamp: "2024-11-15T02:45:00Z",
    lat: 12.9718,
    lng: 77.594,
    zone: "Block C – Service Road",
    description: "Unscheduled vehicle movement detected on internal service road via motion sensor.",
    metadata: { camera_id: "CCTV-07", plate: "UNKNOWN" },
  },

  // ── Storyline 2: Gate 7 Perimeter Probe (Unresolved) ─────────────────────
  {
    id: "INC-004",
    type: "PERIMETER_BREACH",
    timestamp: "2024-11-15T04:30:00Z",
    lat: 12.9740,
    lng: 77.5920,
    zone: "Gate 7 – East Perimeter",
    description: "PIR motion sensor fired at outer perimeter. No badge activity correlated.",
    metadata: { sensor_id: "PIR-G7-E2", duration_seconds: 8 },
  },
  {
    id: "INC-005",
    type: "DRONE_SIGHTING",
    timestamp: "2024-11-15T04:33:00Z",
    lat: 12.9742,
    lng: 77.5918,
    zone: "Gate 7 – Airspace",
    description: "Drone patrol P7 captured unidentified object near gate perimeter at 48m altitude.",
    metadata: { patrol_id: "P7-RTN", altitude_m: 48, object_type: "Unknown" },
  },

  // ── Storyline 3: Routine Patrol (Harmless) ───────────────────────────────
  {
    id: "INC-006",
    type: "ROUTINE_PATROL",
    timestamp: "2024-11-15T01:00:00Z",
    lat: 12.969,
    lng: 77.5965,
    zone: "Warehouse A – West Wing",
    description: "Scheduled night round completed. No anomalies found.",
    metadata: { guard_id: "SEC-22", patrol_route: "Alpha-3" },
  },
  {
    id: "INC-007",
    type: "ROUTINE_PATROL",
    timestamp: "2024-11-15T03:30:00Z",
    lat: 12.97,
    lng: 77.597,
    zone: "Parking Lot B",
    description: "Patrol logged 3 authorized overnight vehicles. All plates matched registry.",
    metadata: { guard_id: "SEC-31", vehicles_verified: 3 },
  },

  // ── Storyline 4: Badge anomaly – isolated late entry (Low confidence) ────
  {
    id: "INC-008",
    type: "BADGE_FAILURE",
    timestamp: "2024-11-15T05:10:00Z",
    lat: 12.9708,
    lng: 77.5935,
    zone: "Admin Block – Main Gate",
    description: "Badge BD-4471 attempted admin block entry. Arjun (Logistics) has no night clearance.",
    metadata: { badge_id: "BD-4471", reader_id: "RDR-ADM-01", attempt_count: 1 },
  },
];

// ─── AI Pre-Generated Storylines ─────────────────────────────────────────────
export const STORYLINES: Storyline[] = [
  {
    id: "STY-001",
    title: "Unauthorized Access – Block C",
    zone: "Block C",
    lat: 12.9715,
    lng: 77.5945,
    risk: "critical",
    status: "NEEDS_REVIEW",
    hypothesis:
      "Three correlated events within 30 minutes suggest a single actor. Badge BD-9942 (Raghav Nair, Facilities) attempted Block C storage entry after a fence vibration event. A vehicle was subsequently detected on the service road. Raghav is a day-shift employee with no night authorization. This could be an emergency pipe repair or unauthorized entry.",
    confidence: "medium",
    confidence_pct: 64,
    incident_ids: ["INC-001", "INC-002", "INC-003"],
    ai_recommendation:
      "Dispatch drone to Block C service road to visually confirm vehicle identity. Cross-check facility maintenance logs for emergency work orders submitted last evening.",
  },
  {
    id: "STY-002",
    title: "Unresolved Perimeter Activity – Gate 7",
    zone: "Gate 7 – East Perimeter",
    lat: 12.9741,
    lng: 77.5919,
    risk: "warning",
    status: "NEEDS_REVIEW",
    hypothesis:
      "Drone patrol P7 detected an unidentified object near Gate 7 at 04:30 AM, corroborating a PIR sensor trigger 3 minutes earlier. Object altitude (48m) is above typical wildlife but below commercial drone ceiling. No badge or personnel activity in the area. Could be a rogue drone or large bird.",
    confidence: "low",
    confidence_pct: 38,
    incident_ids: ["INC-004", "INC-005"],
    ai_recommendation:
      "Confidence is below threshold for a clear hypothesis. Recommend drone recon to collect updated imagery for this zone.",
  },
  {
    id: "STY-003",
    title: "Routine Patrols – No Issues",
    zone: "Warehouse A / Parking Lot B",
    lat: 12.9695,
    lng: 77.5967,
    risk: "info",
    status: "NEEDS_REVIEW",
    hypothesis:
      "Two scheduled guard rounds completed without incident. Warehouse A west wing cleared. Parking Lot B vehicle count matches end-of-day registry (3 authorized vehicles).",
    confidence: "high",
    confidence_pct: 97,
    incident_ids: ["INC-006", "INC-007"],
    ai_recommendation: "No action required. Approve to add as 'All Clear' note to morning briefing.",
  },
  {
    id: "STY-004",
    title: "Isolated Badge Event – Admin Block",
    zone: "Admin Block",
    lat: 12.9708,
    lng: 77.5935,
    risk: "warning",
    status: "NEEDS_REVIEW",
    hypothesis:
      "Single badge swipe by Arjun Pillai (Logistics) at Admin Block at 05:10 AM. No follow-up motion. Could be an early arrival or a mistaken swipe on the wrong reader. Low correlation with other overnight events.",
    confidence: "low",
    confidence_pct: 42,
    incident_ids: ["INC-008"],
    ai_recommendation:
      "Isolated, low-confidence event. No drone action needed now. Recommend Maya verbally follow up with Arjun during morning shift.",
  },
];
