import express from "express";
import cors from "cors";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";

const app = express();
const port = 3005;

// Allowed origins for CORS
const allowedOrigins = [
  "chrome-extension://ilhkfbhlcodigfjhohdnlblpkllboioa",
  "https://app.centraldispatch.com",
  "http://localhost:3000", // optional, for local dev
];

// Apply CORS globally
app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like curl or postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

// Parse JSON bodies for non-BetterAuth routes
app.use(express.json());

// BetterAuth route
app.all("/api/auth/*splat", toNodeHandler(auth));

// Example protected route to get session
app.get("/api/me", async (req, res) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    return res.json(session);
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: "Not authenticated" });
  }
});

// Example protected route
app.get("/api/protected-data", async (req, res) => {
  try {
    console.log("req:", req.headers);
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token provided" });

    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    return res.json({
      message: "This is protected data!",
      user: session!.user,
    });
  } catch (err) {
    console.error("err-protected-data: ", err);
    res.status(401).json({ error: "Invalid token" });
  }
});

app.get("/api/me-token", async (req, res) => {
  try {
    console.log("req:", req.headers);
    const token = req.headers.authorization?.split(" ")[1];
    console.log("token:", token);
    if (!token) return res.status(401).json({ error: "No token provided" });

    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) return res.status(400).json({ error: "No session" });

    return res.json({ user: session.user });
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: "Invalid token" });
  }
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
