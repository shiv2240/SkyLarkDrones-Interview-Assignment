import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { authenticate, authorize, AuthRequest } from "./middleware/auth.middleware";
import { IntelligenceService } from "./services/intelligence.service";

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "610-assistant-super-secret";

app.use(cors());
app.use(express.json());

// ─── AUTHENTICATION ──────────────────────────────────────────────────────────
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, orgId: user.organizationId },
    JWT_SECRET,
    { expiresIn: "24h" }
  );

  await prisma.auditLog.create({
    data: { action: "LOGIN", operator: user.name, details: "User logged into system", category: "AUTH" }
  });

  res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
});

// ─── SITES (Multi-tenant) ───────────────────────────────────────────────────
app.get("/sites", authenticate, async (req: AuthRequest, res) => {
  const sites = await prisma.site.findMany({
    where: { organizationId: req.user?.orgId }
  });
  res.json(sites);
});

// ─── INTELLIGENCE ────────────────────────────────────────────────────────────
app.get("/intelligence/:siteId", authenticate, async (req: AuthRequest, res) => {
  try {
    const data = await IntelligenceService.synthesize(req.params.siteId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── OBSERVABILITY (RBAC Protected for Site Heads) ───────────────────────────
app.get("/admin/logs", authenticate, authorize(["SITE_HEAD", "ADMIN"]), async (req, res) => {
  const logs = await prisma.auditLog.findMany({
    orderBy: { timestamp: "desc" },
    take: 50
  });
  res.json(logs);
});

app.listen(PORT, () => {
  console.log(`⬡ 6:10 Assistant API running at http://localhost:${PORT}`);
});
