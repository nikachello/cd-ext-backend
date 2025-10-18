import { Router, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth";

const router = Router();

router.get("/me", async (req: Request, res: Response) => {
  try {
    // Get session from Authorization header or cookies
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session?.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Return standardized user object
    const safeUser = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      emailVerified: session.user.emailVerified,
    };

    return res.json(safeUser);
  } catch (err) {
    console.error("Error in /api/me:", err);
    return res.status(401).json({ error: "Not authenticated" });
  }
});

export default router;
