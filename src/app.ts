// src/app.ts
import "module-alias/register";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { corsOptionsDelegate } from "./middlewares/corsMiddleware";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import organizationRoutes from "./routes/organizationRoutes";
import memberRoutes from "./routes/memberRoutes";

dotenv.config();

const app = express();

// Middleware
app.use(cors(corsOptionsDelegate));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api", userRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/members", memberRoutes);

// Health check
app.get("/", (_, res) => res.json({ status: "ok" }));

export default app;
