// src/app.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { corsOptionsDelegate } from "./middlewares/corsMiddleware";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import organisationRoutes from "./routes/organisationRoutes";

dotenv.config();

const app = express();

// Middleware
app.use(cors(corsOptionsDelegate));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api", userRoutes);
app.use("/api/organisations", organisationRoutes);

// Health check
app.get("/", (_, res) => res.json({ status: "ok" }));

export default app;
