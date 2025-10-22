import { Request } from "express";
import { CorsOptions, CorsOptionsDelegate } from "cors";

const allowedOrigins: string[] = [
  "chrome-extension://ilhkfbhlcodigfjhohdnlblpkllboioa",
  "https://app.centraldispatch.com",
  "http://localhost:3000",
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

  // Allow requests with no origin (like mobile apps, Postman, or same-origin)
  if (!origin || allowedOrigins.includes(origin)) {
    callback(null, {
      origin: true,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], // Add OPTIONS
      allowedHeaders: ["Content-Type", "Authorization"], // Add this
      exposedHeaders: ["Set-Cookie"], // Add this to expose cookies
    });
  } else {
    callback(new Error("Not allowed by CORS"), { origin: false });
  }
};
