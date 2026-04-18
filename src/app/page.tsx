"use client";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Incident, Storyline } from "@/lib/data";
import Header from "@/components/Header/Header";
import StorylineCard from "@/components/StorylineCard/StorylineCard";
import BriefingDrawer from "@/components/BriefingDrawer/BriefingDrawer";
import type { Step } from "react-joyride";
import styles from "./page.module.css";

const Joyride = dynamic(
  () => import("react-joyride").then((mod) => mod.Joyride),
  {
    ssr: false,
  },
);


const MapCanvas = dynamic(
  () =>
    import("@/components/MapCanvas/MapCanvas").then(
      (mod) => mod.default || mod,
    ),
  {
    ssr: false,
    loading: () => (
      <div className={styles.mapLoading}>
        <span className={styles.loadSpinner} />
        Loading Map...
      </div>
    ),
  },
);

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
  droneNestLat: number;
  droneNestLng: number;
  zoom: number;
  storylines: any[];
  incidents: any[];
  sites: Site[];
}

export default function DashboardPage() {
  const { token, user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<IntelligenceData | null>(null);
  const [storylines, setStorylines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [siteLoading, setSiteLoading] = useState(false);
  const [activeSiteId, setActiveSiteId] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [droneTarget, setDroneTarget] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [activeDroneId, setActiveDroneId] = useState<string | null>(null);
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "review" | "harmless" | "approved" | "discarded"
  >("review");
  const [runTour, setRunTour] = useState(false);
  const [sites, setSites] = useState<Site[]>([]);

  const cardsListRef = useRef<HTMLDivElement>(null);

  // ── Memoized Map Props (Performance Caching) ──────────────────────────────
  const mapCenter = useMemo(
    () => data?.center || { lat: 12.9716, lng: 77.595 },
    [data?.center],
  );
  const droneNest = useMemo(
    () => ({ lat: data?.droneNestLat || 0, lng: data?.droneNestLng || 0 }),
    [data?.droneNestLat, data?.droneNestLng],
  );
  const incidents = useMemo(() => data?.incidents || [], [data?.incidents]);
  const selectedStoryline = useMemo(
    () => storylines.find((s) => s.id === selectedId) || null,
    [storylines, selectedId],
  );

  // ── Auth Check ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !token) {
      router.push("/login");
    }
  }, [authLoading, token, router]);

  // ── Guided Tour Steps ────────────────────────────────────────────────────
  const tourSteps: Step[] = useMemo(() => [
    {
      target: "body",
      content:
        "Welcome back, Maya. The AI has synthesized the overnight logs. Let's review the anomalies.",
      placement: "center",
      disableBeacon: true, // Show the message immediately without the pulsing dot
    },
    {
      target: `.${styles.greeting}`,
      content:
        "This is your AI briefing. It provides a quick summary of the most critical storyline identified.",
    },
    {
      target: `.${styles.statsRow}`,
      content:
        "Check your site metrics here. Any high signal counts in 'Anomalies' should be investigated.",
    },
    {
      target: `.${styles.tabs}`,
      content:
        "Switch between raw investigative clusters, routine patrols, and your finalized decisions.",
    },
    {
      target: `.${styles.cardsList}`,
      content:
        "Interact with these storylines to see the Agent Trace, Dispatch Drones, or Approve the briefing.",
    },
  ], []);

  // ── Fetch Intelligence ──────────────────────────────────────────────────
  const fetchIntelligence = useCallback(
    async (siteId: string, isSwitch = false) => {
      if (!token) return;
      if (isSwitch) setSiteLoading(true);
      else setLoading(true);

      try {
        const res = await fetch(`/api/intelligence/${siteId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          logout();
          return;
        }

        const json = await res.json();

        setData(json);
        setStorylines(
          (json.storylines || []).map((s: any) => ({
            ...s,
            incident_ids: Array.isArray(s.incidentIds)
              ? s.incidentIds
              : typeof s.incidentIds === "string"
                ? s.incidentIds.split(",").filter(Boolean)
                : [],
            confidence_pct: s.confidencePct,
            ai_recommendation: s.aiRecommendation,
            agent_reasoning: (() => {
              if (Array.isArray(s.agentReasoning)) return s.agentReasoning;
              if (typeof s.agentReasoning === "string") {
                try {
                  const parsed = JSON.parse(s.agentReasoning);
                  return Array.isArray(parsed) ? parsed : [s.agentReasoning];
                } catch {
                  return [s.agentReasoning];
                }
              }
              return [];
            })(),
          })),
        );

        setSelectedId(null);
        setDroneTarget(null);
        setActiveTab("review");

        if (!localStorage.getItem("610_tour_done")) {
          setRunTour(true);
          localStorage.setItem("610_tour_done", "true");
        }
      } catch (err) {
        console.error("Failed to load intelligence:", err);
      } finally {
        setLoading(false);
        setSiteLoading(false);
      }
    },
    [token, logout],
  );

  // ── Initial Site Load ───────────────────────────────────────────────────
  useEffect(() => {
    const fetchSites = async () => {
      if (!token) return;
      try {
        const res = await fetch("/api/sites", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          logout();
          return;
        }

        const sitesList = await res.json();
        setSites(sitesList);
        if (sitesList.length > 0) {
          const firstSiteId = sitesList[0].id;
          setActiveSiteId(firstSiteId);
          fetchIntelligence(firstSiteId);
        }
      } catch (err) {
        console.error("Failed to load sites", err);
      }
    };
    fetchSites();
  }, [token, fetchIntelligence]);

  // Handle Approve/Discard/Drone (Simplified for demo, usually would hit backend)
  const handleApprove = (id: string, note?: string) => {
    setStorylines((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, status: "APPROVED", approved_note: note } : s,
      ),
    );
  };

  const handleDiscard = (id: string) => {
    setStorylines((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "DISCARDED" } : s)),
    );
  };

  const handleDispatchDrone = async (storyline: any) => {
    setActiveDroneId(storyline.id);
    setDroneTarget({ lat: storyline.lat, lng: storyline.lng });
    setStorylines((prev) =>
      prev.map((s) =>
        s.id === storyline.id ? { ...s, status: "DRONE_DISPATCHED" } : s,
      ),
    );

    // Simulate API delay
    await new Promise((r) => setTimeout(r, 2000));
    setStorylines((prev) =>
      prev.map((s) =>
        s.id === storyline.id
          ? {
              ...s,
              status: "DRONE_RETURNED",
              drone_result: {
                report: "Thermal scan clear. No person detected.",
                confidence: "high",
              },
            }
          : s,
      ),
    );
    setActiveDroneId(null);
  };

  const pendingCount = storylines.filter((s) =>
    ["NEEDS_REVIEW", "DRONE_RETURNED"].includes(s.status),
  ).length;
  const approvedStorylines = storylines.filter((s) => s.status === "APPROVED");
  const tabStorylines = storylines.filter((s) => {
    if (activeTab === "review")
      return ["NEEDS_REVIEW", "DRONE_DISPATCHED", "DRONE_RETURNED"].includes(
        s.status,
      );
    return s.status === activeTab.toUpperCase();
  });

  if (authLoading || (loading && !data)) {
    return (
      <div className={styles.loadingScreen}>
        <span className={styles.loadSpinner} /> Initializing 6:10 Assistant...
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <Joyride
        key="industrial-tour"
        steps={tourSteps}
        run={runTour}
        continuous
        showProgress
        showSkipButton
        styles={{
          // @ts-ignore
          options: {
            primaryColor: "#fbbf24",
            textColor: "#f8fafc",
            backgroundColor: "#0f172a",
            zIndex: 10000,
          },
          tooltipContent: {
            fontSize: "15.5px",
            lineHeight: "1.6",
            padding: "12px 0",
          },
          tooltip: {
            maxWidth: "520px",
            borderRadius: "12px",
            border: "1px solid hsla(42, 90%, 55%, 0.3)",
          },
          buttonNext: {
            padding: "8px 24px",
            borderRadius: "6px",
            fontWeight: "600",
          },
        }}
      />

      <Header
        operator={user?.name || "Maya"}
        site={data?.site || "Site Overview"}
        generatedAt={data?.generated_at || new Date().toISOString()}
        pendingCount={pendingCount}
        approvedCount={approvedStorylines.length}
        onOpenBriefing={() => setBriefingOpen(true)}
        sites={sites}
        activeSiteId={activeSiteId}
        onSiteChange={(id) => {
          setActiveSiteId(id);
          fetchIntelligence(id, true);
        }}
        isSiteLoading={siteLoading}
      />

      <div className={styles.body}>
        <aside
          className={`${styles.leftPanel} ${siteLoading ? styles.panelLoading : ""}`}
        >
          {data?.raghav_note && (
            <div className={styles.ragNote}>
              <span className={styles.ragNoteIcon}>📋</span>
              <span className={styles.ragNoteText}>{data.raghav_note}</span>
            </div>
          )}

          <div className={styles.greeting}>
            <div className={styles.greetingIcon}>⬡</div>
            <p className={styles.greetingText}>{data?.greeting}</p>
          </div>

          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{data?.total_signals}</span>
              <span className={styles.statLabel}>Total Signals</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue} style={{ color: "#f87171" }}>
                {data?.anomalous_signals}
              </span>
              <span className={styles.statLabel}>Anomalies</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue} style={{ color: "#60a5fa" }}>
                {data?.routine_signals}
              </span>
              <span className={styles.statLabel}>Routine</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue} style={{ color: "#fbbf24" }}>
                {data?.critical_count}
              </span>
              <span className={styles.statLabel}>Critical</span>
            </div>
          </div>

          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === "review" ? styles.activeTab : ""}`}
              onClick={() => setActiveTab("review")}
            >
              Review{" "}
              {pendingCount > 0 && (
                <span className={styles.tabCount}>{pendingCount}</span>
              )}
            </button>
            <button
              className={`${styles.tab} ${activeTab === "harmless" ? styles.activeTab : ""}`}
              onClick={() => setActiveTab("harmless")}
            >
              Harmless{" "}
              {storylines.filter((s) => s.status === "HARMLESS").length > 0 && (
                <span className={styles.tabCount}>
                  {storylines.filter((s) => s.status === "HARMLESS").length}
                </span>
              )}
            </button>
            <button
              className={`${styles.tab} ${activeTab === "approved" ? styles.activeTab : ""}`}
              onClick={() => setActiveTab("approved")}
            >
              Approved{" "}
              {storylines.filter((s) => s.status === "APPROVED").length > 0 && (
                <span className={styles.tabCount}>
                  {storylines.filter((s) => s.status === "APPROVED").length}
                </span>
              )}
            </button>
          </div>

          <div className={styles.cardsList} ref={cardsListRef}>
            {tabStorylines.map((s) => (
              <StorylineCard
                key={s.id}
                storyline={s}
                isSelected={selectedId === s.id}
                onSelect={() =>
                  setSelectedId(selectedId === s.id ? null : s.id)
                }
                onApprove={(note) => handleApprove(s.id, note)}
                onDiscard={() => handleDiscard(s.id)}
                onDispatchDrone={() => handleDispatchDrone(s)}
                isDroneLoading={activeDroneId === s.id}
              />
            ))}
          </div>
        </aside>

        <main className={styles.mapPanel}>
          <MapCanvas
            incidents={incidents}
            storylines={storylines}
            selectedStoryline={selectedStoryline}
            droneTarget={droneTarget}
            mapCenter={mapCenter}
            droneNest={droneNest}
            mapZoom={data?.zoom || 15}
          />
        </main>
      </div>

      <BriefingDrawer
        isOpen={briefingOpen}
        onClose={() => setBriefingOpen(false)}
        approvedStorylines={approvedStorylines}
        operator={user?.name || "Maya"}
        site={data?.site || ""}
      />
    </div>
  );
}
