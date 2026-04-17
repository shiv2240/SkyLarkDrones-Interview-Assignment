"use client";
import { useEffect, useRef, useState, useCallback, memo } from "react";
import { Incident, Storyline } from "@/lib/data";
import styles from "./MapCanvas.module.css";

interface MapCanvasProps {
  incidents: Incident[];
  storylines: Storyline[];
  selectedStoryline: Storyline | null;
  droneTarget: { lat: number; lng: number } | null;
  mapCenter: { lat: number; lng: number };
  droneNest: { lat: number; lng: number };
  mapZoom: number;
}

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

const MapCanvas = memo(({
  incidents,
  storylines,
  selectedStoryline,
  droneTarget,
  mapCenter,
  droneNest,
  mapZoom
}: MapCanvasProps) => {
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
  const [mapReady, setMapReady] = useState(false);

  // ── Init Leaflet ──────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      // If we already have a map, don't re-init, just return
      if (mapInstance.current) return;

      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      if (cancelled || !mapRef.current) return;

      const map = L.map(mapRef.current!, {
        center: [mapCenter.lat, mapCenter.lng],
        zoom: mapZoom,
        zoomControl: false,
        attributionControl: false,
      });

      const accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      const tileUrl = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}@2x?access_token=${accessToken}`;

      L.tileLayer(tileUrl, {
        maxZoom: 22,
        tileSize: 512,
        zoomOffset: -1,
        attribution: 'Mapbox',
      }).addTo(map);

      mapInstance.current = map;
      setMapReady(true);
    }
    initMap();

    return () => {
      cancelled = true;
    };
  }, []); // Only init once on mount

  // ── Sync External Center/Zoom ──
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;
    mapInstance.current.setView([mapCenter.lat, mapCenter.lng], mapZoom, { animate: true });
  }, [mapReady, mapCenter.lat, mapCenter.lng, mapZoom]);

  // ── Render Layer (Markers/Clusters) ──
  const layerGroup = useRef<any>(null);
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;

    // Clear old markers
    if (layerGroup.current) {
        mapInstance.current.removeLayer(layerGroup.current);
    }

    async function updateLayers() {
        const L = (await import("leaflet")).default;
        const group = L.layerGroup().addTo(mapInstance.current);
        layerGroup.current = group;

        // Draw storyline zones
        storylines.forEach((s) => {
            const color = RISK_COLORS[s.risk] || "#6b7280";
            L.circle([s.lat, s.lng], {
                radius: 80,
                color,
                fillColor: color,
                fillOpacity: 0.1,
                weight: 1.5,
                dashArray: "4 4",
                opacity: 0.5,
            }).addTo(group);
        });

        // Draw incidents
        incidents.forEach((inc) => {
            const storyline = storylines.find((s) => s.incident_ids.includes(inc.id));
            const color = storyline ? (RISK_COLORS[storyline.risk] || "#6b7280") : "#6b7280";
            const icon = TYPE_ICONS[inc.type] || "•";
            const time = new Date(inc.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });

            const divIcon = L.divIcon({
                className: "",
                html: `<div class="${styles.mapMarker}" style="--marker-color:${color}">
                        <div class="${styles.markerDot}"></div>
                        <div class="${styles.markerLabel}">${icon} ${time}</div>
                      </div>`,
                iconSize: [40, 40],
                iconAnchor: [20, 20],
            });

            L.marker([inc.lat, inc.lng], { icon: divIcon })
                .bindPopup(inc.description)
                .addTo(group);
        });

        // Drone Nest
        const nestIcon = L.divIcon({
            className: "",
            html: `<div class="${styles.nestMarker}">🏠</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
        });
        L.marker([droneNest.lat, droneNest.lng], { icon: nestIcon }).addTo(group);
    }
    updateLayers();
  }, [mapReady, incidents, storylines, droneNest]);

  // ── Pan to selected storyline ─────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapInstance.current || !selectedStoryline) return;
    mapInstance.current.flyTo([selectedStoryline.lat, selectedStoryline.lng], 16, {
      animate: true, duration: 1.2,
    });
  }, [mapReady, selectedStoryline]);

  // ── Drone animation ───────────────────────────────────────────────────────
  const animateDrone = useCallback(async (target: { lat: number; lng: number }) => {
    if (!mapReady || !mapInstance.current) return;
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

    const marker = L.marker([droneNest.lat, droneNest.lng], { icon: droneIcon }).addTo(mapInstance.current);
    droneMarker.current = marker;

    // Draw path
    const path = L.polyline([[droneNest.lat, droneNest.lng], [target.lat, target.lng]], {
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
      const lat = droneNest.lat + (target.lat - droneNest.lat) * t;
      const lng = droneNest.lng + (target.lng - droneNest.lng) * t;
      marker.setLatLng([lat, lng]);
      setDroneProgress(Math.round(t * 100));
      step++;
      animFrame.current = requestAnimationFrame(() => setTimeout(tick, 30));
    };
    tick();
  }, [mapReady, droneNest.lat, droneNest.lng]);

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
});

MapCanvas.displayName = "MapCanvas";
export default MapCanvas;
