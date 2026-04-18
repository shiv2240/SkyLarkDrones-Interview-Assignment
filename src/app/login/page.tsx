"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import styles from "./login.module.css";
import { Shield, ChevronRight } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      console.log("Attempting login for:", email);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      console.log("Login successful, redirecting...");
      login(data.token, data.user);
      router.push("/");
    } catch (err: any) {
      console.error("Login Error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.overlay} />
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <Shield className={styles.icon} />
            <span className={styles.logoText}>6:10 ASSISTANT</span>
          </div>
          <p className={styles.subtitle}>Industrial Intelligence Platform</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}
          
          <div className={styles.inputGroup}>
            <label>Site Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="operator@ridgeway.com"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Security Key</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" disabled={isLoading} className={styles.submitBtn}>
            {isLoading ? "Authenticating..." : "Synchronize Access"}
            {!isLoading && <ChevronRight size={18} />}
          </button>
        </form>

        <div className={styles.footer}>
          <p>Login as Maya (operator123) or Nisha (manager123)</p>
          <p>Personnel clearance verified at 6:10 AM local time.</p>
        </div>
      </div>
    </div>
  );
}
