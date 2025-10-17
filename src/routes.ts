import { Router } from "express";
import fetch from "node-fetch";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET;
const BETTERAUTH_API = process.env.BETTERAUTH_API;

if (!JWT_SECRET || !BETTERAUTH_API) throw new Error("Missing env variables");

interface BetterAuthResponse {
  token?: string;
  [key: string]: any;
}

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    const response = await fetch(BETTERAUTH_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data: BetterAuthResponse =
      (await response.json()) as BetterAuthResponse;

    if (!data.token) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const jwtToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: "1h" });

    res.json({ token: jwtToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
