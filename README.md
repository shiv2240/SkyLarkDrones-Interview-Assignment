# ⬡ 6:10 Assistant | Overnight Intelligence Platform

### *Founding Full Stack Engineer Assignment – Skylark Drones*

The **6:10 Assistant** is a high-stakes, AI-native intelligence platform designed for Ridgeway Site. It empowers Maya, the Operations Lead, to move from a mess of overnight signals to a trusted morning decision in under two hours.

---

## 🚀 Unified Operation Launch
The entire platform (Frontend, Backend, and Database) is now consolidated into a single, high-performance Next.js application.

1. **Setup Environment**:
   - Copy `.env.local.example` to `.env.local` in the **root** directory and add your `NEXT_PUBLIC_MAPBOX_TOKEN`, `GROQ_API_KEY`, and `JWT_SECRET`.
2. **Install Dependencies**: `npm install`
3. **Database Readiness**: `npx prisma generate`
4. **Launch Platform**:
   ```bash
   npm run dev
   ```
   *This launches the unified platform (UI + API) on port 3000.*

---

## 🌐 Live Deployment
The platform is also deployed and can be accessed here:
**[Live Demo Link](https://sky-lark-drones-interview-assignmen.vercel.app/)**

---

## 🔐 Testing Credentials

| Persona | Email | Security Key (Password) | Role |
| :--- | :--- | :--- | :--- |
| **Maya (Operator)** | `maya@ridgeway.com` | `operator123` | Investigative Lead |
| **Nisha (Site Head)** | `nisha@ridgeway.com` | `manager123` | Executive Reviewer |

---

## 📖 The Story
Every morning, the site "knows" something happened, but nobody knows the full story. Between raw logs and Maya’s 8:00 AM briefing for Site Head Nisha, there is a gap of uncertainty. This platform fills that gap by deploying an **Autonomous Intelligence Agent** that investigates context, correlates signals, and drafts the morning truth.

---

## 🕵️‍♂️ Key Features
- **AI-First Investigation**: Powered by **Groq (Llama-3.3-70b)**, performing sub-second correlation of raw signals into "Storylines."
- **Spatial Intelligence**: High-density **Mapbox GL** interface linked 1:1 with physical sensor coordinates.
- **Drone Simulation**: Imperative flight simulation for real-time thermal/visual recon.
- **Agent Trace**: Full transparency into the AI's step-by-step logic (investigative breadcrumbs).
- **Morning Briefing**: Human-in-the-loop compiler that drafts the summary for the 8:00 AM meeting.

---

## 🛠 Multi-Tier Architecture
- **Unified Stack**: Next.js 16 (Monolithic App Router Architecture).
- **Backend Logic**: Next.js Route Handlers (integrated API with JWT & RBAC).
- **Vercel Optimization**: Implemented dynamic absolute path resolution for SQLite to ensure serverless compatibility.
- **Database**: Prisma ORM with SQLite (Fast, portable, and production-ready for industrial edge).
- **Mapping**: Leaflet + Mapbox Vector Tiles + Custom Industrial Styling.
- **AI**: Groq Llama-3 (Cloud Inference) for sub-second synthesis.

---

## ✅ Fulfillment of Non-Negotiables

| Requirement | Implementation Detail |
| :--- | :--- |
| **AI-First Workflow** | Dynamic correlation of raw signals into investigate narratives on load. |
| **Simple Agent** | Centralized triage logic that handles tool-calling and escalation. |
| **MCP-Style Tools** | Tool-router architecture for `dispatch_drone` and `lookup_employee`. |
| **Spatial Interface** | Precision Mapbox integration synchronized with Storyline navigation. |
| **Drone Simulation** | Real-time flight paths with deterministic recon results. |
| **Unified Launch** | Single-command orchestration for the entire frontend/backend stack. |

---

*Founding Full Stack Engineer Submission*  
**Ridgeway Site Operations Center**  
**SkyLark Drones Review Team** 
