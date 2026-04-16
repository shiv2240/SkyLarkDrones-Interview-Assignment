# ⬡ 6:10 Assistant | Overnight Intelligence Platform

### *Founding Full Stack Engineer Assignment – Skylark Drones*

The **6:10 Assistant** is a high-stakes, AI-native intelligence platform designed for Ridgeway Site. It empowers Maya, the Operations Lead, to move from a mess of overnight signals to a trusted morning decision in under two hours.

## 📖 The Story
Every morning, the site "knows" something happened, but nobody knows the full story. Between raw logs and Maya’s 8:00 AM briefing for Site Head Nisha, there is a gap of uncertainty. This platform fills that gap by deploying an **Autonomous Intelligence Agent** that investigates context, correlates signals, and drafts the morning truth.

---

## 🚀 Key Features

### 🕵️‍♂️ AI-First Investigation
Unlike traditional dashboards, the "6:10 Assistant" performs **Deep Synthesis** before the user logs in. Powered by **Groq (Llama-3.3-70b)**, the system correlates fence alerts, badge failures, and drone missions into cohesive narrative "Storylines."

### 🚁 Lightweight Agent & Drone Simulation
The system features a real Agent that decides when a situation warrants verification.
- **Dispatch Drone**: Simulated recon missions return thermal data, personnel counts, and visual confirmations.
- **Badge Lookup**: Agentic tool-calling to verify if "Raghav" or "Arjun" were authorized for specific zones.

### 🗺️ Spatial Intelligence
A high-resolution **Mapbox GL** interface is the core of the workflow. The system pans and zooms Maya to the exact epicenter of an incident cluster, providing 1:1 spatial context for every AI hypothesis.

### 🛡️ Human-in-the-Loop Review
Maya is always in control. She can:
- **Inspect Agent Trace**: View the step-by-step logic the AI used to correlate signals.
- **Override Hypotheses**: Discard noise or approve critical events.
- **Finalize the Briefing**: Compile a professional summary for the 8:00 AM meeting with Nisha.

---

## 🛠 Tech Stack
- **Framework**: Next.js 16 (App Router, TypeScript)
- **AI Engine**: Groq SDK (Llama-3.3-70b-versatile) for sub-second inference.
- **Mapping**: react-leaflet + Mapbox Vector/Raster Tiles.
- **Styling**: Vanilla CSS (Industrial Dark Mode, Glassmorphism).
- **Icons**: Custom SVG + Lucide-react.

---

## ✅ Fulfillment of Non-Negotiables

| Requirement | Implementation Detail |
| :--- | :--- |
| **AI-First Workflow** | Dynamic correlation of 8+ raw signals into 4 investigate narratives on load. |
| **Simple Agent** | Centralized triage logic that decides between "Harmless" closure and "Recon" escalation. |
| **MCP-Style Tools** | Tool-router architecture for `dispatch_drone` and `lookup_employee`. |
| **Spatial Interface** | Meaningful Mapbox integration synced with the narrative sidebar. |
| **Drone Simulation** | Flight simulation with real-time recon results (Thermal/Personnel/Vehicles). |
| **Review Layer** | Custom "Agent Trace" component and Morning Briefing compiler. |

---

## 🏗 Setup & Installation

1. **Clone the repository**
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Set up Environment Variables (`.env.local`)**:
   ```env
   GROQ_API_KEY=your_key_here
   NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
   ```
4. **Run Development Server**:
   ```bash
   npm run dev
   ```

---

## 🤖 AI-Powered Development Methodology
This project was built using an **AI-Native Workflow**. 
- **Agentic Coding**: Used specialized AI agents to handle the migration from Gemini to Groq while maintaining type safety.
- **Iterative Refinement**: Leveraged AI for industrial UI design and complex spatial logic synchronization.
- **Deep Synthesis**: The core "Investigation Engine" in `route.ts` was designed using prompt-engineering techniques to ensure the AI surfaces "Uncertainty" rather than making "Confident Guesses."

---

*Founding Full Stack Engineer Submission*  
**Ridgeway Site Operations Center**  
*6:10 AM | Generated for Nisha (Site Head)*
