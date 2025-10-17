import express from "express";
import cors from "cors";
import { corsOptionsDelegate } from "./middlewares/corsMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { PORT } from "./utils/env.js";

const app = express();

app.use(cors(corsOptionsDelegate));
app.use(express.json());

// BetterAuth route
app.use("/api/auth", authRoutes);

// Custom routes
app.use("/api", userRoutes);

// Health check (optional)
app.get("/", (_, res) => res.send("✅ API running"));

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
