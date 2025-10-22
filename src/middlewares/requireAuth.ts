import { NextFunction, Request, Response } from "express";
import { auth } from "../lib/auth";
import { fromNodeHeaders } from "better-auth/node";
import { prisma } from "../lib/prisma";
import { UserRole } from "@prisma/client";

interface AuthenticatedRequest extends Request {
  userId?: string;
  userRole?: UserRole;
}

export const isAuthorized = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session?.user) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    req.userId = session.user.id;
    req.userRole = user.role;

    next();
  } catch (error) {
    console.error("Authorization error:", error);
    return res.status(401).json({ error: "Authentication failed" });
  }
};

export const isSuperAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  } catch (error) {
    console.error("isSuperAdmin error:", error);
    return res.status(500).json({ error: error });
  }
};
