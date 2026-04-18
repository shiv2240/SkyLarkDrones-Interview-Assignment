import { useState } from "react";
import SiteSelector from "@/components/SiteSelector/SiteSelector";
import AuditLogs from "@/components/AuditLogs/AuditLogs";
import { useAuth } from "@/context/AuthContext";
import { Activity } from "lucide-react";
import styles from "./Header.module.css";

interface Site {
  id: string;
  name: string;
  label: string;
  city: string;
}

interface HeaderProps {
  operator: string;
  site: string;
  generatedAt: string;
  pendingCount: number;
  approvedCount: number;
  onOpenBriefing: () => void;
  sites: Site[];
  activeSiteId: string;
  onSiteChange: (siteId: string) => void;
  isSiteLoading: boolean;
}

export default function Header({
  operator, site, generatedAt, pendingCount, approvedCount,
  onOpenBriefing, sites, activeSiteId, onSiteChange, isSiteLoading,
}: HeaderProps) {
  const { user } = useAuth();
  const [logsOpen, setLogsOpen] = useState(false);

  const time = new Date(generatedAt).toLocaleString("en-IN", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata",
  });

  const isManager = user?.role === "SITE_HEAD" || user?.role === "ADMIN";

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <div className={styles.logoMark}>
          <svg viewBox="0 0 28 28" fill="none" width="28" height="28">
            <polygon points="14,2 26,9 26,20 14,26 2,20 2,9" stroke="hsl(42,90%,58%)" strokeWidth="1.5" fill="none"/>
            <circle cx="14" cy="14" r="4" fill="hsl(42,90%,58%)"/>
            <line x1="14" y1="2" x2="14" y2="10" stroke="hsl(42,90%,58%)" strokeWidth="1.5" opacity="0.5"/>
            <line x1="26" y1="9" x2="18.9" y2="13" stroke="hsl(42,90%,58%)" strokeWidth="1.5" opacity="0.5"/>
            <line x1="26" y1="20" x2="18.9" y2="15.5" stroke="hsl(42,90%,58%)" strokeWidth="1.5" opacity="0.5"/>
            <line x1="14" y1="26" x2="14" y2="18" stroke="hsl(42,90%,58%)" strokeWidth="1.5" opacity="0.5"/>
            <line x1="2" y1="20" x2="9.1" y2="15.5" stroke="hsl(42,90%,58%)" strokeWidth="1.5" opacity="0.5"/>
            <line x1="2" y1="9" x2="9.1" y2="13" stroke="hsl(42,90%,58%)" strokeWidth="1.5" opacity="0.5"/>
          </svg>
        </div>
        <div className={styles.brandText}>
          <span className={styles.brandName}>6:10 Assistant</span>
          <span className={styles.brandSite}>{site}</span>
        </div>
      </div>

      <div className={styles.siteSelectorWrap}>
        <SiteSelector
          sites={sites}
          activeSiteId={activeSiteId}
          onChange={onSiteChange}
          isLoading={isSiteLoading}
        />
      </div>

      <div className={styles.meta}>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Operator</span>
          <span className={styles.metaValue}>{operator}</span>
        </div>
        <div className={styles.divider} />
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>AI Analysis At</span>
          <span className={styles.metaValue}>{time} IST</span>
        </div>
      </div>

      <div className={styles.actions}>
        {isManager && (
          <button 
            className={styles.logsBtn} 
            onClick={() => setLogsOpen(true)}
            title="View System Audit Logs"
          >
            <Activity size={18} />
            Agent Activity
          </button>
        )}
        
        {pendingCount > 0 && (
          <div className={styles.pendingBadge}>
            <span className={styles.pendingDot} />
            {pendingCount} pending review
          </div>
        )}
        <button
          className={styles.briefingBtn}
          onClick={onOpenBriefing}
          disabled={approvedCount === 0}
          title={approvedCount === 0 ? "Approve at least one storyline to generate briefing" : "Open Morning Briefing"}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.396 0 2.7.39 3.8 1.065.11.065.242.1.382.1h.022c.14 0 .272-.035.382-.1A7.967 7.967 0 0114.5 14a7.969 7.969 0 013.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>
          </svg>
          Morning Brief
          {approvedCount > 0 && <span className={styles.approvedCount}>{approvedCount}</span>}
        </button>

        <div className={styles.divider} />

        <button className={styles.logoutBtn} onClick={() => { localStorage.clear(); window.location.href = "/login"; }}>
           Sign Out
        </button>
      </div>

      <AuditLogs isOpen={logsOpen} onClose={() => setLogsOpen(false)} />
    </header>
  );
}
