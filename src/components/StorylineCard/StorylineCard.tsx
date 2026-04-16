"use client";
import { useState } from "react";
import { Storyline, RiskLevel, ConfidenceLevel } from "@/lib/data";
import styles from "./StorylineCard.module.css";

interface StorylineCardProps {
  storyline: Storyline;
  isSelected: boolean;
  onSelect: () => void;
  onApprove: (note?: string) => void;
  onDiscard: () => void;
  onDispatchDrone: () => void;
  isDroneLoading: boolean;
  isLowConfidence: boolean;
}

const RISK_CONFIG: Record<RiskLevel, { label: string; icon: string }> = {
  critical: { label: "Critical", icon: "🔴" },
  warning: { label: "Warning", icon: "🟡" },
  info: { label: "Routine", icon: "🔵" },
};

const CONFIDENCE_CONFIG: Record<ConfidenceLevel, { color: string; bar: number }> = {
  high: { color: "var(--success-dot)", bar: 90 },
  medium: { color: "var(--warning-dot)", bar: 60 },
  low: { color: "var(--critical-dot)", bar: 30 },
};

export default function StorylineCard({
  storyline,
  isSelected,
  onSelect,
  onApprove,
  onDiscard,
  onDispatchDrone,
  isDroneLoading,
}: StorylineCardProps) {
  const [showNote, setShowNote] = useState(false);
  const [showTrace, setShowTrace] = useState(false);
  const [note, setNote] = useState("");
  const risk = RISK_CONFIG[storyline.risk];
  const conf = CONFIDENCE_CONFIG[storyline.confidence];

  const isTerminal =
    storyline.status === "APPROVED" || storyline.status === "DISCARDED";
  const isDroneActive =
    storyline.status === "DRONE_DISPATCHED" || storyline.status === "DRONE_RETURNED";

  return (
    <div
      className={`${styles.card} ${isSelected ? styles.selected : ""} ${styles[storyline.risk]} ${isTerminal ? styles.terminal : ""}`}
      onClick={!isTerminal ? onSelect : undefined}
      role={!isTerminal ? "button" : undefined}
      tabIndex={!isTerminal ? 0 : undefined}
      onKeyDown={!isTerminal ? (e) => e.key === "Enter" && onSelect() : undefined}
    >
      {/* ── Header row ── */}
      <div className={styles.cardHeader}>
        <div className={styles.riskBadge} data-risk={storyline.risk}>
          <span className={styles.riskDot} />
          <span className={styles.riskLabel}>{risk.label}</span>
        </div>
        {storyline.confidence_pct < 50 && (
          <div className={styles.uncertaintyBadge} title="AI is unsure. Recommend manual verification.">
            ⚠️ Low Confidence
          </div>
        )}
        <span className={styles.zone}>{storyline.zone}</span>
        <span className={styles.statusChip} data-status={storyline.status}>
          {storyline.status === "APPROVED" && "✓ Approved"}
          {storyline.status === "DISCARDED" && "✗ Discarded"}
          {storyline.status === "NEEDS_REVIEW" && "Needs Review"}
          {storyline.status === "DRONE_DISPATCHED" && "🚁 Drone Flying..."}
          {storyline.status === "DRONE_RETURNED" && "🚁 Drone Complete"}
        </span>
      </div>

      {/* ── Title ── */}
      <h3 className={styles.title}>{storyline.title}</h3>

      {/* ── Confidence bar ── */}
      <div className={styles.confidenceRow}>
        <span className={styles.confidenceLabel}>AI Confidence</span>
        <div className={styles.barTrack}>
          <div
            className={styles.barFill}
            style={{ width: `${storyline.confidence_pct}%`, background: conf.color }}
          />
        </div>
        <span className={styles.confidencePct} style={{ color: conf.color }}>
          {storyline.confidence_pct}%
        </span>
      </div>

      {/* ── Hypothesis (expanded when selected) ── */}
      {isSelected && (
        <div className={styles.hypothesis}>
          <p className={styles.hypothesisLabel}>AI Hypothesis</p>
          <p className={styles.hypothesisText}>{storyline.hypothesis}</p>

          {/* ── Signal Manifest (Evidence) ── */}
          <div className={styles.manifest}>
            <p className={styles.manifestLabel}>Raw Signal Manifest ({storyline.incident_ids.length})</p>
            <div className={styles.manifestList}>
              {storyline.incident_ids.map(id => (
                <span key={id} className={styles.manifestTag}>{id}</span>
              ))}
            </div>
          </div>

          {/* ── Agent Trace ── */}
          {storyline.agent_reasoning && storyline.agent_reasoning.length > 0 && (
            <div className={styles.traceContainer}>
              <button 
                className={styles.traceToggle}
                onClick={(e) => { e.stopPropagation(); setShowTrace(!showTrace); }}
              >
                {showTrace ? "Hide Agent Trace" : "View Agent Trace"} 
                <span className={styles.traceIcon}>{showTrace ? "▴" : "▾"}</span>
              </button>
              
              {showTrace && (
                <div className={styles.traceLogs}>
                  {storyline.agent_reasoning.map((step, idx) => (
                    <div key={idx} className={styles.traceStep}>
                      <span className={styles.traceDot} />
                      <span className={styles.traceLine} />
                      <span className={styles.traceText}>{step}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <p className={styles.recommendLabel}>Recommendation</p>
          <p className={styles.recommendText}>{storyline.ai_recommendation}</p>

          {/* Drone result panel */}
          {storyline.drone_result && (
            <div className={styles.droneResult}>
              <div className={styles.droneResultHeader}>
                <span className={styles.droneResultIcon}>🚁</span>
                <span className={styles.droneResultTitle}>Drone Recon Report</span>
                <span className={styles.droneResultConf} data-conf={storyline.drone_result.confidence}>
                  {storyline.drone_result.confidence} confidence
                </span>
              </div>
              <p className={styles.droneResultText}>{storyline.drone_result.report}</p>
              <div className={styles.droneStats}>
                <div className={styles.droneStat}>
                  <span className={styles.droneStatLabel}>Personnel</span>
                  <span className={styles.droneStatValue}>
                    {storyline.drone_result.personnel_detected}
                  </span>
                </div>
                <div className={styles.droneStat}>
                  <span className={styles.droneStatLabel}>Vehicles</span>
                  <span className={styles.droneStatValue}>
                    {storyline.drone_result.vehicles_detected}
                  </span>
                </div>
                <div className={styles.droneStat}>
                  <span className={styles.droneStatLabel}>Thermal Anomaly</span>
                  <span className={styles.droneStatValue}>
                    {storyline.drone_result.thermal_anomaly ? "Yes ⚠️" : "None ✓"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Note input for approval */}
          {showNote && (
            <div className={styles.noteInput} onClick={(e) => e.stopPropagation()}>
              <label className={styles.noteLabel}>Add briefing note (optional)</label>
              <textarea
                className={styles.noteTextarea}
                placeholder="e.g. Confirmed: Raghav was doing emergency pipe inspection. Cleared by Facilities."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />
            </div>
          )}

          {/* ── Action buttons ── */}
          {!isTerminal && (
            <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
              {!showNote ? (
                <button
                  className={styles.btnApprove}
                  onClick={() => setShowNote(true)}
                >
                  ✓ Approve & Add to Brief
                </button>
              ) : (
                <button
                  className={styles.btnApprove}
                  onClick={() => {
                    onApprove(note);
                    setShowNote(false);
                    setNote("");
                  }}
                >
                  ✓ Confirm Approval
                </button>
              )}

              {storyline.risk !== "info" && !isDroneActive && (
                <button
                  className={styles.btnDrone}
                  onClick={onDispatchDrone}
                  disabled={isDroneLoading}
                >
                  {isDroneLoading ? (
                    <span className={styles.spinner} />
                  ) : (
                    "🚁"
                  )}
                  {isDroneLoading ? "Flying..." : "Dispatch Drone"}
                </button>
              )}

              {showNote && (
                <button
                  className={styles.btnCancel}
                  onClick={() => { setShowNote(false); setNote(""); }}
                >
                  Cancel
                </button>
              )}

              <button
                className={styles.btnDiscard}
                onClick={onDiscard}
              >
                Discard
              </button>
            </div>
          )}
        </div>
      )}

      {/* Approved note preview (collapsed) */}
      {storyline.status === "APPROVED" && storyline.approved_note && (
        <p className={styles.approvedNote}>"{storyline.approved_note}"</p>
      )}

      {/* Incidents count */}
      <div className={styles.incidentCount}>
        {storyline.incident_ids.length} event{storyline.incident_ids.length !== 1 ? "s" : ""} correlated
      </div>
    </div>
  );
}
