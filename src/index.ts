import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { corsOptionsDelegate } from "./middlewares/corsMiddleware";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";

dotenv.config();

const app = express();
const port = process.env.PORT || 3005;

// Middleware
app.use(cors(corsOptionsDelegate));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

app.use("/api", userRoutes);

// Health check
app.get("/", (_, res) => res.json({ status: "ok" }));

// Server
app.listen(port, () => {
  console.log(`✅ Server listening on http://localhost:${port}`);
});
