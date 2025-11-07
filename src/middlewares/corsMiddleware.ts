import { Request } from "express";
import { CorsOptionsDelegate } from "cors";

const allowedOrigins: string[] = [
  "https://app.centraldispatch.com",
  "http://localhost:3000",
  "http://localhost:3005",
  "https://cd-ext-backend.onrender.com",
  "http://localhost:3001",
  "https://central-super-hpuhcut2t-nikachellos-projects.vercel.app",
  "https://central-super.vercel.app",
];

export const corsOptionsDelegate: CorsOptionsDelegate<Request> = (
  req,
  callback
) => {
  const origin = req.headers.origin;

  const isChromeExtension =
    typeof origin === "string" && origin.startsWith("chrome-extension://");

  if (!origin || allowedOrigins.includes(origin) || isChromeExtension) {
    callback(null, {
      origin: true,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      exposedHeaders: ["Set-Cookie"],
    });
  } else {
    console.warn(`❌ Blocked by CORS: ${origin}`);
    callback(new Error("Not allowed by CORS"), { origin: false });
  }
};
