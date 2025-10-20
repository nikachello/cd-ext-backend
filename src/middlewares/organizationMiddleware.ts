import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "src/types/requestTypes";
import { prisma } from "../lib/prisma";

export function validateOrgId(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.params.id) {
    return res.status(400).json({ error: "Organization ID is required" });
  }
  next();
}

export function validateCreateOrg(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const { name, slug } = req.body;
  if (!name || !slug) {
    return res.status(400).json({ error: "Name and slug are required" });
  }
  next();
}

export async function canManageOrganization(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const orgId = req.params.id;

  if (!orgId) {
    return res.status(400).json({ error: "Organization ID is required" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.role === "SUPER_ADMIN") {
      return next();
    }

    const member = await prisma.member.findFirst({
      where: {
        organizationId: orgId,
        userId: req.userId!,
        role: { in: ["MANAGER", "ADMIN"] },
      },
    });

    if (!member) {
      return res
        .status(403)
        .json({ error: "Access denied: insufficient permissions" });
    }

    return next();
  } catch (error) {
    console.error("canManageOrganization error:", error);
    return res.status(501).json({ error: error });
  }
}
