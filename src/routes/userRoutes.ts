import { Router, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth.js";

const router = Router();

router.get("/me", async (req: Request, res: Response) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    return res.json(session);
  } catch (err) {
    res.status(401).json({ error: "Not authenticated" });
  }
});

router.get("/protected-data", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token" });

    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    res.json({ message: "Protected data", user: session?.user });
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
