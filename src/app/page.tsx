"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Incident, Storyline } from "@/lib/data";
import Header from "@/components/Header/Header";
import StorylineCard from "@/components/StorylineCard/StorylineCard";
import BriefingDrawer from "@/components/BriefingDrawer/BriefingDrawer";
import styles from "./page.module.css";

const MapCanvas = dynamic(() => import("@/components/MapCanvas/MapCanvas"), {
  ssr: false,
  loading: () => <div className={styles.mapLoading}><span className={styles.loadSpinner} />Loading Map...</div>,
});

interface Site {
  id: string;
  name: string;
  label: string;
  city: string;
}

interface IntelligenceData {
  generated_at: string;
  site_id: string;
  operator: string;
  site: string;
  raghav_note: string;
  total_signals: number;
  routine_signals: number;
  anomalous_signals: number;
  critical_count: number;
  needs_review_count: number;
  greeting: string;
  center: { lat: number; lng: number };
  droneNest: { lat: number; lng: number };
  zoom: number;
  storylines: Storyline[];
  incidents: Incident[];
  sites: Site[];
}

const DEFAULT_SITE = "horizon-blr";

export default function DashboardPage() {
  const [data, setData] = useState<IntelligenceData | null>(null);
  const [storylines, setStorylines] = useState<Storyline[]>([]);
  const [loading, setLoading] = useState(true);
  const [siteLoading, setSiteLoading] = useState(false);
  const [activeSiteId, setActiveSiteId] = useState(DEFAULT_SITE);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [droneTarget, setDroneTarget] = useState<{ lat: number; lng: number } | null>(null);
  const [activeDroneId, setActiveDroneId] = useState<string | null>(null);
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"review" | "harmless" | "approved" | "discarded">("review");
  const cardsListRef = useRef<HTMLDivElement>(null);

  // ── Auto-scroll to selected card ─────────────────────────────────────────
  useEffect(() => {
    if (!selectedId || !cardsListRef.current) return;
    const card = cardsListRef.current.querySelector(`[data-storyline-id="${selectedId}"]`);
    if (card) card.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedId]);

  // ── Fetch intelligence for a given site ──────────────────────────────────
  const fetchIntelligence = useCallback(async (siteId: string, isSwitch = false) => {
    if (isSwitch) setSiteLoading(true);
    else setLoading(true);

    try {
      const res = await fetch(`/api/intelligence?site=${siteId}`);
      const json: IntelligenceData = await res.json();
      setData(json);
      setStorylines(json.storylines); // Keep status from API (NEEDS_REVIEW or HARMLESS)
      setSelectedId(null);
      setDroneTarget(null);
      setActiveDroneId(null);
      setActiveTab("review");
    } catch (err) {
      console.error("Failed to load intelligence:", err);
    } finally {
      setLoading(false);
      setSiteLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIntelligence(activeSiteId);
  }, [activeSiteId, fetchIntelligence]);

  // ── Site switch handler ───────────────────────────────────────────────────
  const handleSiteChange = useCallback((siteId: string) => {
    setActiveSiteId(siteId);
    fetchIntelligence(siteId, true);
  }, [fetchIntelligence]);

  // ── Story actions ─────────────────────────────────────────────────────────
  const handleApprove = useCallback((id: string, note?: string) => {
    setStorylines((prev) => prev.map((s) => s.id === id ? { ...s, status: "APPROVED", approved_note: note || "" } : s));
    setSelectedId(null);
  }, []);

  const handleDiscard = useCallback((id: string) => {
    setStorylines((prev) => prev.map((s) => s.id === id ? { ...s, status: "DISCARDED" } : s));
    setSelectedId(null);
  }, []);

  const handleDispatchDrone = useCallback(async (storyline: Storyline) => {
    setActiveDroneId(storyline.id);
    setDroneTarget({ lat: storyline.lat, lng: storyline.lng });
    setStorylines((prev) => prev.map((s) => s.id === storyline.id ? { ...s, status: "DRONE_DISPATCHED" } : s));

    try {
      const res = await fetch("/api/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "dispatch_drone", storyline_id: storyline.id, site_id: activeSiteId }),
      });
      const json = await res.json();
      if (json.success) {
        setStorylines((prev) => prev.map((s) => s.id === storyline.id ? { ...s, status: "DRONE_RETURNED", drone_result: json.result } : s));
      }
    } catch (err) {
      console.error("Drone dispatch failed:", err);
    } finally {
      setActiveDroneId(null);
    }
  }, [activeSiteId]);

  // ── Computed ──────────────────────────────────────────────────────────────
  const pendingCount = storylines.filter((s) => ["NEEDS_REVIEW", "DRONE_RETURNED"].includes(s.status)).length;
  const harmlessCount = storylines.filter((s) => s.status === "HARMLESS").length;
  const approvedStorylines = storylines.filter((s) => s.status === "APPROVED");
  const discardedStorylines = storylines.filter((s) => s.status === "DISCARDED");
  const selectedStoryline = storylines.find((s) => s.id === selectedId) ?? null;

  const tabStorylines =
    activeTab === "review"
      ? storylines.filter((s) => ["NEEDS_REVIEW", "DRONE_DISPATCHED", "DRONE_RETURNED"].includes(s.status))
      : activeTab === "harmless" ? storylines.filter((s) => s.status === "HARMLESS")
      : activeTab === "approved" ? approvedStorylines : discardedStorylines;

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingContent}>
          <div className={styles.scanningLine} />
          <h1 className={styles.loadingTitle}>6:10 AM Assistant</h1>
          <p className={styles.loadingSubtitle}>Investigating Site Anomalies…</p>
          
          <div className={styles.investigationLogs}>
            <div className={styles.investigationLog}>• Correlating sensor triggers...</div>
            <div className={styles.investigationLog}>• Analyzing perimeter fence vibration data...</div>
            <div className={styles.investigationLog}>• Cross-referencing personnel access roster...</div>
            <div className={styles.investigationLog}>• Cluster analysis of thermal anomalies...</div>
          </div>

          <div className={styles.loadingProgress}>
            <div className={styles.loadingProgressFill} />
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.loadingScreen}>
        <p style={{ color: "var(--critical-text)" }}>Error loading intelligence data. Please refresh.</p>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <Header
        operator={data.operator}
        site={data.site}
        generatedAt={data.generated_at}
        pendingCount={pendingCount}
        approvedCount={approvedStorylines.length}
        onOpenBriefing={() => setBriefingOpen(true)}
        sites={data.sites}
        activeSiteId={activeSiteId}
        onSiteChange={handleSiteChange}
        isSiteLoading={siteLoading}
      />

      <div className={styles.body}>
        {/* ── Left: Narrative Panel ── */}
        <aside className={`${styles.leftPanel} ${siteLoading ? styles.panelLoading : ""}`}>
          {/* ── Night Supervisor Note ── */}
          {data.raghav_note && (
            <div className={styles.ragNote}>
              <span className={styles.ragNoteIcon}>📋</span>
              <span className={styles.ragNoteText}>{data.raghav_note}</span>
            </div>
          )}

          {/* ── AI greeting ── */}
          <div className={styles.greeting}>
            <div className={styles.greetingIcon}>⬡</div>
            <p className={styles.greetingText}>{data.greeting}</p>
          </div>

          {/* ── Signal stats ── */}
          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{data.total_signals}</span>
              <span className={styles.statLabel}>Total Signals</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue} style={{ color: "var(--warning-dot)" }}>{data.anomalous_signals}</span>
              <span className={styles.statLabel}>Anomalies</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue} style={{ color: "var(--success-dot)" }}>{data.routine_signals}</span>
              <span className={styles.statLabel}>Routine</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue} style={{ color: "var(--critical-dot)" }}>{data.critical_count}</span>
              <span className={styles.statLabel}>Critical</span>
            </div>
          </div>

          {/* ── Tabs ── */}
          <div className={styles.tabs}>
            <button className={`${styles.tab} ${activeTab === "review" ? styles.activeTab : ""}`} onClick={() => setActiveTab("review")}>
              Review <span className={styles.tabCount}>{storylines.filter(s => ["NEEDS_REVIEW","DRONE_DISPATCHED","DRONE_RETURNED"].includes(s.status)).length}</span>
            </button>
            <button className={`${styles.tab} ${activeTab === "harmless" ? styles.activeTab : ""}`} onClick={() => setActiveTab("harmless")}>
              Harmless <span className={styles.tabCount}>{harmlessCount}</span>
            </button>
            <button className={`${styles.tab} ${activeTab === "approved" ? styles.activeTab : ""}`} onClick={() => setActiveTab("approved")}>
              Approved <span className={styles.tabCount}>{approvedStorylines.length}</span>
            </button>
            <button className={`${styles.tab} ${activeTab === "discarded" ? styles.activeTab : ""}`} onClick={() => setActiveTab("discarded")}>
              Discarded <span className={styles.tabCount}>{discardedStorylines.length}</span>
            </button>
          </div>

          {/* ── Storyline cards ── */}
          <div className={styles.cardsList} ref={cardsListRef}>
            {siteLoading ? (
              <div className={styles.switchingOverlay}>
                <span className={styles.loadSpinner} />
                <span>Loading site intelligence…</span>
              </div>
            ) : tabStorylines.length === 0 ? (
              <div className={styles.tabEmpty}>
                {activeTab === "review" ? "All events reviewed. ✓" : `No ${activeTab} items.`}
              </div>
            ) : (
              tabStorylines.map((s) => (
                <div key={s.id} data-storyline-id={s.id}>
                  <StorylineCard
                    storyline={s}
                    isSelected={selectedId === s.id}
                    onSelect={() => setSelectedId(selectedId === s.id ? null : s.id)}
                    onApprove={(note) => handleApprove(s.id, note)}
                    onDiscard={() => handleDiscard(s.id)}
                    onDispatchDrone={() => handleDispatchDrone(s)}
                    isDroneLoading={activeDroneId === s.id}
                  />
                </div>
              ))
            )}
          </div>
        </aside>

        {/* ── Right: Map Panel ── */}
        <main className={styles.mapPanel}>
          <MapCanvas
            incidents={data.incidents}
            storylines={storylines}
            selectedStoryline={selectedStoryline}
            droneTarget={droneTarget}
            mapCenter={data.center}
            droneNest={data.droneNest}
            mapZoom={data.zoom}
          />
        </main>
      </div>

      <BriefingDrawer
        isOpen={briefingOpen}
        onClose={() => setBriefingOpen(false)}
        approvedStorylines={approvedStorylines}
        operator={data.operator}
        site={data.site}
      />
    </div>
  );
}
