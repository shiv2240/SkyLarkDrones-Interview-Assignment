// ─── Simulated Multi-Site Data Layer ─────────────────────────────────────────
// Each site has its own geo-center, drone nest, incidents, storylines, and employees.
// In production, this would be fetched from a PostGIS database per site_id.

export type IncidentType =
  | "FENCE_ALERT"
  | "BADGE_FAILURE"
  | "VEHICLE_MOTION"
  | "DRONE_SIGHTING"
  | "PERIMETER_BREACH"
  | "ROUTINE_PATROL";

export type ConfidenceLevel = "high" | "medium" | "low";
export type StorylineStatus = "NEEDS_REVIEW" | "APPROVED" | "DISCARDED" | "DRONE_DISPATCHED" | "DRONE_RETURNED" | "HARMLESS";
export type RiskLevel = "critical" | "warning" | "info";

export interface Incident {
  id: string;
  type: IncidentType;
  timestamp: string;
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
  imageSrc: string;
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
  agent_reasoning?: string[];
  drone_result?: DroneResult;
  approved_note?: string;
}

export interface SiteConfig {
  id: string;
  name: string;
  label: string;           // short display label
  city: string;
  center: { lat: number; lng: number };
  droneNest: { lat: number; lng: number };
  zoom: number;
  operator: string;
  raghav_note: string;     // the contextual overnight note left by night supervisor
  employees: Record<string, Employee>;
  incidents: Incident[];
  droneReconResults: Record<string, DroneResult>;
}

// ═════════════════════════════════════════════════════════════════════════════
// SITE 1 – Horizon Industrial Park, Bangalore South
// ═════════════════════════════════════════════════════════════════════════════
const SITE_BANGALORE: SiteConfig = {
  id: "horizon-blr",
  name: "Horizon Industrial Park – Bangalore South",
  label: "Horizon Park · Bengaluru",
  city: "Bengaluru",
  center: { lat: 12.9716, lng: 77.595 },
  droneNest: { lat: 12.9680, lng: 77.5980 },
  zoom: 15,
  operator: "Maya Krishnan",
  raghav_note: "Please check Block C before leadership asks. Raghav.",

  employees: {
    "BD-9942": { badge_id: "BD-9942", name: "Raghav Nair", department: "Facilities & Maintenance", shift: "Day (07:00–16:00)", authorized_zones: ["Workshop", "Utilities Block", "Gate 1"], night_shift_approved: false },
    "BD-1102": { badge_id: "BD-1102", name: "Sanjana Mehta", department: "Security", shift: "Night (22:00–06:00)", authorized_zones: ["All Zones"], night_shift_approved: true },
    "BD-4471": { badge_id: "BD-4471", name: "Arjun Pillai", department: "Logistics", shift: "Day (08:00–17:00)", authorized_zones: ["Dispatch Bay", "Parking Lot A"], night_shift_approved: false },
  },

  incidents: [
    { id: "BLR-001", type: "FENCE_ALERT", timestamp: "2024-11-15T02:15:00Z", lat: 12.9716, lng: 77.5946, zone: "Block C – North Fence", description: "Fence vibration sensor triggered. 4 pulses detected over 12 seconds.", metadata: { sensor_id: "FEN-C-N-04", pulse_count: 4 } },
    { id: "BLR-002", type: "BADGE_FAILURE", timestamp: "2024-11-15T02:17:33Z", lat: 12.9712, lng: 77.5951, zone: "Block C – Storage Entry", description: "Badge BD-9942 (Raghav Nair, Facilities) failed reader. Not on night roster.", metadata: { badge_id: "BD-9942", reader_id: "RDR-C-03", attempt_count: 3 } },
    { id: "BLR-003", type: "VEHICLE_MOTION", timestamp: "2024-11-15T02:45:00Z", lat: 12.9718, lng: 77.594, zone: "Block C – Service Road", description: "Unscheduled vehicle movement detected on internal service road via motion sensor.", metadata: { camera_id: "CCTV-07", plate: "UNKNOWN" } },
    { id: "BLR-004", type: "PERIMETER_BREACH", timestamp: "2024-11-15T04:30:00Z", lat: 12.9740, lng: 77.5920, zone: "Gate 7 – East Perimeter", description: "PIR motion sensor fired at outer perimeter. No badge activity correlated.", metadata: { sensor_id: "PIR-G7-E2", duration_seconds: 8 } },
    { id: "BLR-005", type: "DRONE_SIGHTING", timestamp: "2024-11-15T04:33:00Z", lat: 12.9742, lng: 77.5918, zone: "Gate 7 – Airspace", description: "Drone patrol P7 captured unidentified object near gate perimeter at 48m altitude.", metadata: { patrol_id: "P7-RTN", altitude_m: 48, object_type: "Unknown" } },
    { id: "BLR-006", type: "ROUTINE_PATROL", timestamp: "2024-11-15T01:00:00Z", lat: 12.969, lng: 77.5965, zone: "Warehouse A – West Wing", description: "Scheduled night round completed. No anomalies found.", metadata: { guard_id: "SEC-22", patrol_route: "Alpha-3" } },
    { id: "BLR-007", type: "ROUTINE_PATROL", timestamp: "2024-11-15T03:30:00Z", lat: 12.97, lng: 77.597, zone: "Parking Lot B", description: "Patrol logged 3 authorized overnight vehicles. All plates matched registry.", metadata: { guard_id: "SEC-31", vehicles_verified: 3 } },
    { id: "BLR-008", type: "BADGE_FAILURE", timestamp: "2024-11-15T05:10:00Z", lat: 12.9708, lng: 77.5935, zone: "Admin Block – Main Gate", description: "Badge BD-4471 attempted admin block entry. Arjun (Logistics) has no night clearance.", metadata: { badge_id: "BD-4471", reader_id: "RDR-ADM-01", attempt_count: 1 } },
  ],



  droneReconResults: {
    "STY-BLR-001": { report: "Drone thermal scan of Block C service road complete. Single white utility van (partial plate: KA-05) confirmed stationary near Maintenance Hatch 3. No unauthorized personnel visible outside the vehicle. Maintenance access panel appears to be open. Consistent with an emergency pipe inspection.", imageSrc: "", thermal_anomaly: false, personnel_detected: 0, vehicles_detected: 1, confidence: "high" },
    "STY-BLR-002": { report: "Drone recon of Gate 7 perimeter complete. No personnel or ground vehicles detected. Airspace scan at 50m radius returned clear. PIR trigger may have been caused by thermal updraft or large avian. No structural breach of perimeter fence detected.", imageSrc: "", thermal_anomaly: false, personnel_detected: 0, vehicles_detected: 0, confidence: "medium" },
  },
};

// ═════════════════════════════════════════════════════════════════════════════
// SITE 2 – Nexus Logistics Hub, Chennai East
// ═════════════════════════════════════════════════════════════════════════════
const SITE_CHENNAI: SiteConfig = {
  id: "nexus-che",
  name: "Nexus Logistics Hub – Chennai East",
  label: "Nexus Hub · Chennai",
  city: "Chennai",
  center: { lat: 13.0827, lng: 80.2900 },
  droneNest: { lat: 13.080, lng: 80.2935 },
  zoom: 15,
  operator: "Priya Venkat",
  raghav_note: "Karthik is authorized for extra maintenance in Bay 4 tonight. Door sensor might be glitchy. — Priya.",

  employees: {
    "CH-2201": { badge_id: "CH-2201", name: "Karthik Sundaram", department: "Cold Chain Ops", shift: "Night (21:00–06:00)", authorized_zones: ["Cold Storage", "Bay 4", "Loading Dock"], night_shift_approved: true },
    "CH-3385": { badge_id: "CH-3385", name: "Deepa Rajan", department: "Security", shift: "Night (22:00–06:00)", authorized_zones: ["All Zones"], night_shift_approved: true },
    "CH-7712": { badge_id: "CH-7712", name: "Murugan Pillai", department: "Transport", shift: "Day (06:00–15:00)", authorized_zones: ["Truck Bay", "Parking Lot"], night_shift_approved: false },
  },

  incidents: [
    { id: "CHE-001", type: "VEHICLE_MOTION", timestamp: "2024-11-15T01:22:00Z", lat: 13.0831, lng: 80.2894, zone: "Truck Bay – Gate B", description: "Unregistered truck entered truck bay via Gate B at 01:22 AM. CCTV timestamp synced.", metadata: { camera_id: "CAM-TB-02", plate: "TN09-AX-7791" } },
    { id: "CHE-002", type: "BADGE_FAILURE", timestamp: "2024-11-15T01:25:00Z", lat: 13.0829, lng: 80.289, zone: "Cold Storage – Bay 4 Entry", description: "Badge CH-7712 (Murugan Pillai, Transport) attempted cold storage entry. Transport staff have no cold storage authorization.", metadata: { badge_id: "CH-7712", reader_id: "RDR-CS-04", attempt_count: 2 } },
    { id: "CHE-003", type: "FENCE_ALERT", timestamp: "2024-11-15T01:28:00Z", lat: 13.0826, lng: 80.2888, zone: "Cold Storage – South Fence", description: "Fence sensor triggered near Bay 4 perimeter. 2 pulses detected in 6 seconds.", metadata: { sensor_id: "FEN-CS-S-02", pulse_count: 2 } },
    { id: "CHE-004", type: "ROUTINE_PATROL", timestamp: "2024-11-15T00:00:00Z", lat: 13.0822, lng: 80.2908, zone: "Lor a person surveying the gate without entry. Isolated, no supporting signals.", confidence: "low", confidence_pct: 31, incident_ids: ["CHE-006"], ai_recommendation: "Low-confidence event. Recommend drone sweep of Gate C north approach before 7:00 AM." },
    { id: "STY-CHE-003", title: "Dock & West Wall Patrols – Clear", zone: "Loading Dock / West Wall", lat: 13.0821, lng: 80.2911, risk: "info", status: "NEEDS_REVIEW", hypothesis: "Both scheduled patrol routes completed without incident. All 7 shipping containers remain sealed. West wall lighting is operational.", confidence: "high", confidence_pct: 98, incident_ids: ["CHE-004", "CHE-005"], ai_recommendation: "No action required. Safe to include as 'All Clear' in morning briefing for operations head." },
  ],

  droneReconResults: {
    "STY-CHE-001": { report: "Drone thermal scan of Bay 4 perimeter complete. Unregistered truck (partial match: TN09-AX-77) detected idling 40m from cold storage south fence. One individual visible near truck cab — no PPE or site vest. Bay 4 external door confirmed ajar by 18cm. Recommend immediate ground response.", imageSrc: "", thermal_anomaly: true, personnel_detected: 1, vehicles_detected: 1, confidence: "high" },
    "STY-CHE-002": { report: "Gate C north approach scanned. No personnel or vehicles in approach corridor. Motion trigger likely caused by debris or foliage movement near PIR sensor. Sensor bracket appears loose — maintenance flag raised.", imageSrc: "", thermal_anomaly: false, personnel_detected: 0, vehicles_detected: 0, confidence: "medium" },
  },
};

// ═════════════════════════════════════════════════════════════════════════════
// SITE 3 – Apex Manufacturing Complex, Pune West
// ═════════════════════════════════════════════════════════════════════════════
const SITE_PUNE: SiteConfig = {
  id: "apex-pun",
  name: "Apex Manufacturing Complex – Pune West",
  label: "Apex Complex · Pune",
  city: "Pune",
  center: { lat: 18.5204, lng: 73.8567 },
  droneNest: { lat: 18.5175, lng: 73.8590 },
  zoom: 15,
  operator: "Aditya Shah",
  raghav_note: "Chemical store Sigma-2 had a temperature alarm at 03:15 AM. Auto-suppressed. Worth checking in the morning. — Vikram.",

  employees: {
    "PUN-0091": { badge_id: "PUN-0091", name: "Vikram Bansal", department: "Chemical Safety", shift: "Night (20:00–05:00)", authorized_zones: ["Sigma Wing", "Chemical Store", "Lab Block"], night_shift_approved: true },
    "PUN-5534": { badge_id: "PUN-5534", name: "Lalita Desai", department: "Housekeeping", shift: "Day (06:00–14:00)", authorized_zones: ["Cafeteria", "Admin Lobby"], night_shift_approved: false },
    "PUN-1177": { badge_id: "PUN-1177", name: "Ravi Kulkarni", department: "Engineering", shift: "Day (09:00–18:00)", authorized_zones: ["Workshop", "Machine Room B"], night_shift_approved: false },
  },

  incidents: [
    { id: "PUN-001", type: "FENCE_ALERT", timestamp: "2024-11-15T03:10:00Z", lat: 18.5207, lng: 73.8560, zone: "Sigma Wing – East Fence", description: "Fence vibration alert near chemical storage wing. Single pulse, 3s duration.", metadata: { sensor_id: "FEN-SG-E1", pulse_count: 1 } },
    { id: "PUN-002", type: "BADGE_FAILURE", timestamp: "2024-11-15T03:14:00Z", lat: 18.5205, lng: 73.8563, zone: "Chemical Store Sigma-2", description: "Badge PUN-5534 (Lalita Desai, Housekeeping) attempted Sigma-2 chemical store access. No chemical zone clearance.", metadata: { badge_id: "PUN-5534", reader_id: "RDR-SG-02", attempt_count: 1 } },
    { id: "PUN-003", type: "DRONE_SIGHTING", timestamp: "2024-11-15T03:20:00Z", lat: 18.5208, lng: 73.8558, zone: "Sigma Wing – Airspace", description: "Scheduled patrol drone D3 logged temperature anomaly near Sigma-2 roofline. Auto-alert sent to system.", metadata: { drone_id: "D3", temp_delta_c: 4.2, alert_type: "Thermal" } },
    { id: "PUN-004", type: "BADGE_FAILURE", timestamp: "2024-11-15T04:55:00Z", lat: 18.5198, lng: 73.8572, zone: "Machine Room B – Entry", description: "Badge PUN-1177 (Ravi Kulkarni, Engineering) badged in at Machine Room B 2h before shift start.", metadata: { badge_id: "PUN-1177", reader_id: "RDR-MRB-01", attempt_count: 1 } },
    { id: "PUN-005", type: "ROUTINE_PATROL", timestamp: "2024-11-15T01:30:00Z", lat: 18.5196, lng: 73.858, zone: "Cafeteria – Ground Floor", description: "Routine patrol of public zones complete. Cafeteria locked, no anomalies.", metadata: { guard_id: "G-07", patrol_route: "Public-Loop" } },
  ],



  droneReconResults: {
    "STY-PUN-001": { report: "Drone thermal scan of Sigma-2 roofline complete. Rooftop HVAC unit C3 is running 6°C above normal operating temperature. Possible compressor overheat or refrigerant leak. No visible external breach or structural damage. Recommend chemical safety inspection of HVAC unit C3 before 8 AM. No personnel on roof.", imageSrc: "", thermal_anomaly: true, personnel_detected: 0, vehicles_detected: 0, confidence: "high" },
    "STY-PUN-002": { report: "Drone sweep of Machine Room B exterior complete. No signs of external intrusion. Windows intact, roller shutter secured. Event consistent with early employee arrival rather than unauthorized access.", imageSrc: "", thermal_anomaly: false, personnel_detected: 0, vehicles_detected: 0, confidence: "medium" },
  },
};

// ─── Site Registry ────────────────────────────────────────────────────────────
export const SITES: Record<string, SiteConfig> = {
  "horizon-blr": SITE_BANGALORE,
  "nexus-che": SITE_CHENNAI,
  "apex-pun": SITE_PUNE,
};

export const DEFAULT_SITE_ID = "horizon-blr";

export const EMPLOYEES = SITE_BANGALORE.employees;
export const INCIDENTS = SITE_BANGALORE.incidents;
