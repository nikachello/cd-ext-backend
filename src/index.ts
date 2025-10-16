import express, { Request, Response } from "express";
import cors, { CorsOptions, CorsOptionsDelegate } from "cors";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";

const app = express();
const port = process.env.PORT || 3005;

// Allowed origins for CORS
const allowedOrigins: string[] = [
  "chrome-extension://ilhkfbhlcodigfjhohdnlblpkllboioa",
  "https://app.centraldispatch.com",
  "http://localhost:3000", // optional for local dev
  "https://cd-ext-backend.onrender.com",
];

// ✅ Fully typed CORS delegate
const corsOptionsDelegate: CorsOptionsDelegate<Request> = (
  req: Request,
  callback: (err: Error | null, options?: CorsOptions) => void
) => {
  const origin = req.headers.origin;

  if (!origin || allowedOrigins.includes(origin)) {
    const corsOptions: CorsOptions = {
      origin: true,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE"],
    };
    callback(null, corsOptions);
  } else {
    callback(new Error("Not allowed by CORS"), { origin: false });
  }
};

// ✅ Apply CORS middleware
app.use(cors(corsOptionsDelegate));
app.use(express.json());

// BetterAuth route
app.all("/api/auth/{*any}", toNodeHandler(auth));

// Example protected route to get session
app.get("/api/me", async (req: Request, res: Response) => {
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
app.get("/api/protected-data", async (req: Request, res: Response) => {
  try {
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
    console.error("err-protected-data:", err);
    res.status(401).json({ error: "Invalid token" });
  }
});

// Example route using token explicitly
app.get("/api/me-token", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
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
  console.log(`✅ Server listening on http://localhost:${port}`);
});
