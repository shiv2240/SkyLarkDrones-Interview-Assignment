"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import styles from "./AuditLogs.module.css";
import { Activity, ShieldAlert, Cpu, LogIn, X } from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  operator: string;
  details: string;
  category: string;
  timestamp: string;
}

export default function AuditLogs({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { token } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && token) {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      fetch(`${API_BASE}/admin/logs`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        setLogs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => console.error("Failed to fetch logs", err));
    }
  }, [isOpen, token]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <Activity className={styles.icon} />
            <h2>Agent Activity Monitor</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>

        <div className={styles.content}>
          {loading ? (
            <div className={styles.loading}>Synchronizing secure logs...</div>
          ) : logs.length === 0 ? (
            <div className={styles.empty}>No audit logs found. System operational.</div>
          ) : (
            <div className={styles.logList}>
              {logs.map(log => (
                <div key={log.id} className={styles.logItem}>
                  <div className={styles.logIcon}>
                    {log.category === "AI" ? <Cpu size={16} /> : 
                     log.category === "AUTH" ? <LogIn size={16} /> : 
                     <ShieldAlert size={16} />}
                  </div>
                  <div className={styles.logBody}>
                    <div className={styles.logHeader}>
                      <span className={styles.operator}>{log.operator}</span>
                      <div className={styles.headerRight}>
                        <span className={styles.time}>
                          {new Date(log.timestamp).toLocaleString("en-IN", { 
                            day: "2-digit", 
                            month: "short", 
                            hour: "2-digit", 
                            minute: "2-digit" 
                          })}
                        </span>
                        <div className={styles.categoryTag} data-cat={log.category}>{log.category}</div>
                      </div>
                    </div>
                    <div className={styles.action}>{log.action}</div>
                    <div className={styles.details}>{log.details}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <span>Enterprise Observability Module v1.0.4</span>
          <span>Security Clearance Level: SITE_HEAD</span>
        </div>
      </div>
    </div>
  );
}
