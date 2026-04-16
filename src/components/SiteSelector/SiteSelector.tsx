"use client";
import { useState, useRef, useEffect } from "react";
import styles from "./SiteSelector.module.css";

interface Site {
  id: string;
  name: string;
  label: string;
  city: string;
}

interface SiteSelectorProps {
  sites: Site[];
  activeSiteId: string;
  onChange: (siteId: string) => void;
  isLoading: boolean;
}

const CITY_FLAGS: Record<string, string> = {
  Bengaluru: "🇮🇳",
  Chennai: "🇮🇳",
  Pune: "🇮🇳",
};

export default function SiteSelector({ sites, activeSiteId, onChange, isLoading }: SiteSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeSite = sites.find((s) => s.id === activeSiteId);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(siteId: string) {
    if (siteId !== activeSiteId) {
      onChange(siteId);
    }
    setIsOpen(false);
  }

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        className={`${styles.trigger} ${isOpen ? styles.open : ""} ${isLoading ? styles.loading : ""}`}
        onClick={() => setIsOpen((v) => !v)}
        title="Switch site"
        disabled={isLoading}
        id="site-selector-trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={styles.triggerIcon}>📍</span>
        <span className={styles.triggerLabel}>
          {isLoading ? "Switching site…" : (activeSite?.label ?? "Select site")}
        </span>
        {isLoading ? (
          <span className={styles.spinner} />
        ) : (
          <svg className={`${styles.chevron} ${isOpen ? styles.chevronUp : ""}`} viewBox="0 0 12 12" width="10" height="10" fill="none">
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {isOpen && (
        <div className={styles.dropdown} role="listbox" aria-label="Select site">
          <div className={styles.dropdownHeader}>Switch Site</div>
          {sites.map((site) => (
            <button
              key={site.id}
              className={`${styles.option} ${site.id === activeSiteId ? styles.activeOption : ""}`}
              onClick={() => handleSelect(site.id)}
              role="option"
              aria-selected={site.id === activeSiteId}
            >
              <span className={styles.optionFlag}>{CITY_FLAGS[site.city] ?? "🏭"}</span>
              <div className={styles.optionText}>
                <span className={styles.optionLabel}>{site.label}</span>
                <span className={styles.optionName}>{site.name}</span>
              </div>
              {site.id === activeSiteId && (
                <span className={styles.activeCheck}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
