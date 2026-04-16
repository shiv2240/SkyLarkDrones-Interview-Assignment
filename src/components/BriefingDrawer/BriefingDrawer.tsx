"use client";
import { useState } from "react";
import { Storyline } from "@/lib/data";
import styles from "./BriefingDrawer.module.css";

interface BriefingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  approvedStorylines: Storyline[];
  operator: string;
  site: string;
}

export default function BriefingDrawer({
  isOpen,
  onClose,
  approvedStorylines,
  operator,
  site,
}: BriefingDrawerProps) {
  const [copied, setCopied] = useState(false);

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    timeZone: "Asia/Kolkata",
  });
  const timeStr = now.toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata",
  });

  const RISK_EMOJI: Record<string, string> = {
    critical: "🔴",
    warning: "🟡",
    info: "🔵",
  };

  const getBriefingText = () => {
    const lines = [
      `MORNING SECURITY BRIEF – ${dateStr.toUpperCase()}`,
      `Prepared by: ${operator} | ${site}`,
      `Generated at: ${timeStr} IST`,
      `${"─".repeat(60)}`,
      ``,
      `OVERNIGHT SUMMARY:`,
      `${approvedStorylines.length} storyline(s) reviewed and cleared.`,
      ``,
    ];

    approvedStorylines.forEach((s, i) => {
      lines.push(`[${i + 1}] ${s.title} (${s.zone})`);
      lines.push(`    Finding: ${s.hypothesis.slice(0, 150)}...`);
      if (s.approved_note) {
        lines.push(`    Operator Note: "${s.approved_note}"`);
      }
      if (s.drone_result) {
        lines.push(`    Drone Recon: ${s.drone_result.report.slice(0, 120)}...`);
      }
      lines.push(``);
    });

    lines.push(`${"─".repeat(60)}`);
    lines.push(`END OF BRIEF – ${operator}`);
    return lines.join("\n");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getBriefingText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`${styles.backdrop} ${isOpen ? styles.open : ""}`} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.drawerHeader}>
          <div className={styles.drawerTitle}>
            <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18" style={{ color: "var(--amber-400)" }}>
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.396 0 2.7.39 3.8 1.065.11.065.242.1.382.1h.022c.14 0 .272-.035.382-.1A7.967 7.967 0 0114.5 14a7.969 7.969 0 013.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>
            </svg>
            Morning Intelligence Brief
          </div>
          <div className={styles.drawerMeta}>
            {dateStr} · {timeStr} IST
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        {approvedStorylines.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>📋</span>
            <p>No storylines approved yet.</p>
            <p className={styles.emptyHint}>Approve storylines from the left panel to add them here.</p>
          </div>
        ) : (
          <>
            <div className={styles.briefingMeta}>
              <div className={styles.metaChip}>
                <span>Operator</span>
                <strong>{operator}</strong>
              </div>
              <div className={styles.metaChip}>
                <span>Site</span>
                <strong>{site}</strong>
              </div>
              <div className={styles.metaChip}>
                <span>Items</span>
                <strong>{approvedStorylines.length} reviewed</strong>
              </div>
            </div>

            <div className={styles.items}>
              {approvedStorylines.map((s, i) => (
                <div key={s.id} className={styles.briefingItem}>
                  <div className={styles.itemHeader}>
                    <span className={styles.itemNum}>{i + 1}</span>
                    <span className={styles.itemRisk}>{RISK_EMOJI[s.risk]}</span>
                    <div className={styles.itemTitleGroup}>
                      <span className={styles.itemTitle}>{s.title}</span>
                      <span className={styles.itemZone}>{s.zone}</span>
                    </div>
                    <span className={styles.itemCleared}>✓ Cleared</span>
                  </div>
                  <p className={styles.itemHyp}>
                    {s.hypothesis.slice(0, 200)}{s.hypothesis.length > 200 ? "…" : ""}
                  </p>
                  {s.approved_note && (
                    <div className={styles.operatorNote}>
                      <span className={styles.noteTag}>Operator Note</span>
                      <span className={styles.noteText}>"{s.approved_note}"</span>
                    </div>
                  )}
                  {s.drone_result && (
                    <div className={styles.droneNote}>
                      <span className={styles.noteTag}>🚁 Drone Verified</span>
                      <span className={styles.noteText}>
                        {s.drone_result.report.slice(0, 150)}{s.drone_result.report.length > 150 ? "…" : ""}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className={styles.drawerFooter}>
              <div className={styles.signature}>
                <span className={styles.sigLabel}>Prepared and verified by</span>
                <span className={styles.sigName}>{operator}</span>
              </div>
              <div className={styles.footerActions}>
                <button className={styles.copyBtn} onClick={handleCopy}>
                  {copied ? "✓ Copied!" : "Copy as Text"}
                </button>
                <button className={styles.sendBtn} onClick={() => alert("In production: this would send via email / Slack / Teams.")}>
                  Share Briefing →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
