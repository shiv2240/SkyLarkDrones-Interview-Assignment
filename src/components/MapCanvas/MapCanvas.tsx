"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Incident, Storyline } from "@/lib/data";
import styles from "./MapCanvas.module.css";

interface MapCanvasProps {
  incidents: Incident[];
  storylines: Storyline[];
  selectedStoryline: Storyline | null;
  droneTarget: { lat: number; lng: number } | null;
}

const DRONE_NEST = { lat: 12.9680, lng: 77.5980 };
const RISK_COLORS: Record<string, string> = {
  critical: "#ef4444",
  warning: "#f59e0b",
  info: "#3b82f6",
};
const TYPE_ICONS: Record<string, string> = {
  FENCE_ALERT: "⚡",
  BADGE_FAILURE: "🔑",
  VEHICLE_MOTION: "🚗",
  DRONE_SIGHTING: "🚁",
  PERIMETER_BREACH: "⚠️",
  ROUTINE_PATROL: "✓",
};

export default function MapCanvas({ incidents, storylines, selectedStoryline, droneTarget }: MapCanvasProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstance = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const droneMarker = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dronePath = useRef<any>(null);
  const animFrame = useRef<number>(0);
  const [droneProgress, setDroneProgress] = useState(0);
  const [isDroneFlying, setIsDroneFlying] = useState(false);

  // ── Init Leaflet ──────────────────────────────────────────────────────────
  useEffect(() => {
    // Guard: if a Leaflet instance already exists on this container (React Strict
    // Mode double-invocation), remove it first before re-initialising.
    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    let cancelled = false;

    async function initMap() {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      // Another guard for the async gap — effect may have been cleaned up
      // while the dynamic imports were in flight.
      if (cancelled || !mapRef.current) return;

      // Leaflet attaches `_leaflet_id` to the DOM node after initialisation.
      // If it's already set (e.g. HMR re-run), remove the stale instance first.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((mapRef.current as any)._leaflet_id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapRef.current as any)._leaflet_id = undefined;
      }

      const map = L.map(mapRef.current!, {
        center: [12.9716, 77.595],
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
      });

      // Dark tile layer via CartoDB dark matter
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
        subdomains: "abcd",
      }).addTo(map);

      // Attribution minimal
      L.control.attribution({ position: "bottomright", prefix: "" }).addTo(map);

      // ── Draw storyline zones ──
      storylines.forEach((s) => {
        const color = RISK_COLORS[s.risk] || "#6b7280";

        // Glowing circle zone
        L.circle([s.lat, s.lng], {
          radius: 80,
          color,
          fillColor: color,
          fillOpacity: 0.07,
          weight: 1.5,
          dashArray: "4 4",
          opacity: 0.5,
        }).addTo(map);
      });

      // ── Draw incidents ──
      incidents.forEach((inc) => {
        const storyline = storylines.find((s) => s.incident_ids.includes(inc.id));
        const color = storyline ? (RISK_COLORS[storyline.risk] || "#6b7280") : "#6b7280";
        const icon = TYPE_ICONS[inc.type] || "•";
        const time = new Date(inc.timestamp).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Asia/Kolkata",
        });

        const divIcon = L.divIcon({
          className: "",
          html: `<div class="${styles.mapMarker}" style="--marker-color:${color}" title="${inc.description}">
                   <div class="${styles.markerDot}"></div>
                   <div class="${styles.markerRing}"></div>
                   <div class="${styles.markerLabel}">${icon} ${time}</div>
                 </div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        L.marker([inc.lat, inc.lng], { icon: divIcon })
          .bindPopup(
            `<div style="font-family:Inter,sans-serif;color:#e2e8f0;background:#1a1f2e;padding:8px;border-radius:8px;font-size:12px;max-width:220px;line-height:1.5">
              <strong style="color:#f59e0b">${inc.type.replace(/_/g, " ")}</strong><br/>
              ${inc.zone}<br/><span style="color:#64748b">${time} IST</span><br/>
              <em style="color:#94a3b8">${inc.description}</em>
            </div>`,
            { className: styles.popup }
          )
          .addTo(map);
      });

      // ── Drone Nest marker ──
      const nestIcon = L.divIcon({
        className: "",
        html: `<div class="${styles.nestMarker}">🏠<span class="${styles.nestLabel}">Drone Nest</span></div>`,
        iconSize: [60, 32],
        iconAnchor: [30, 16],
      });
      L.marker([DRONE_NEST.lat, DRONE_NEST.lng], { icon: nestIcon }).addTo(map);

      mapInstance.current = map;
    }
    initMap();

    // Cleanup: destroy the map when the effect is torn down (Strict Mode unmount,
    // HMR, navigation). This prevents the "already initialized" error on remount.
    return () => {
      cancelled = true;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Pan to selected storyline ─────────────────────────────────────────────
  useEffect(() => {
    if (!mapInstance.current || !selectedStoryline) return;
    mapInstance.current.flyTo([selectedStoryline.lat, selectedStoryline.lng], 16, {
      animate: true, duration: 1.2,
    });
  }, [selectedStoryline]);

  // ── Drone animation ───────────────────────────────────────────────────────
  const animateDrone = useCallback(async (target: { lat: number; lng: number }) => {
    if (!mapInstance.current) return;
    const L = (await import("leaflet")).default;

    setIsDroneFlying(true);
    setDroneProgress(0);

    // Remove old drone artifacts
    if (droneMarker.current) droneMarker.current.remove();
    if (dronePath.current) dronePath.current.remove();

    const droneIcon = L.divIcon({
      className: "",
      html: `<div class="${styles.droneMarker}">🚁</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const marker = L.marker([DRONE_NEST.lat, DRONE_NEST.lng], { icon: droneIcon }).addTo(mapInstance.current);
    droneMarker.current = marker;

    // Draw path
    const path = L.polyline([[DRONE_NEST.lat, DRONE_NEST.lng], [target.lat, target.lng]], {
      color: "hsl(195, 90%, 55%)",
      weight: 2,
      dashArray: "6 6",
      opacity: 0.7,
    }).addTo(mapInstance.current);
    dronePath.current = path;

    mapInstance.current.fitBounds(path.getBounds(), { padding: [80, 80], animate: true, duration: 1 });

    // Animate along path
    const STEPS = 80;
    let step = 0;
    const tick = () => {
      if (step > STEPS) {
        setIsDroneFlying(false);
        setDroneProgress(100);
        return;
      }
      const t = step / STEPS;
      const lat = DRONE_NEST.lat + (target.lat - DRONE_NEST.lat) * t;
      const lng = DRONE_NEST.lng + (target.lng - DRONE_NEST.lng) * t;
      marker.setLatLng([lat, lng]);
      setDroneProgress(Math.round(t * 100));
      step++;
      animFrame.current = requestAnimationFrame(() => setTimeout(tick, 30));
    };
    tick();
  }, []);

  useEffect(() => {
    if (droneTarget) animateDrone(droneTarget);
    return () => cancelAnimationFrame(animFrame.current);
  }, [droneTarget, animateDrone]);

  return (
    <div className={styles.wrapper}>
      <div ref={mapRef} className={styles.map} />

      {/* Drone HUD overlay */}
      {(isDroneFlying || droneProgress > 0) && (
        <div className={`${styles.droneHud} ${isDroneFlying ? styles.flying : styles.landed}`}>
          {isDroneFlying ? (
            <>
              <span className={styles.droneEmoji}>🚁</span>
              <div className={styles.hudInfo}>
                <span className={styles.hudTitle}>Drone in flight</span>
                <div className={styles.hudBar}>
                  <div className={styles.hudFill} style={{ width: `${droneProgress}%` }} />
                </div>
                <span className={styles.hudPct}>{droneProgress}% to target</span>
              </div>
            </>
          ) : (
            <>
              <span className={styles.droneEmoji}>✓</span>
              <div className={styles.hudInfo}>
                <span className={styles.hudTitle}>Drone recon complete</span>
                <span className={styles.hudPct}>Report ready in panel</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Grid overlay for aesthetic */}
      <div className={styles.gridOverlay} />

      {/* Legend */}
      <div className={styles.legend}>
        <div className={styles.legendTitle}>Event Types</div>
        {Object.entries(TYPE_ICONS).map(([type, icon]) => (
          <div key={type} className={styles.legendItem}>
            <span>{icon}</span>
            <span className={styles.legendLabel}>{type.replace(/_/g, " ")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
