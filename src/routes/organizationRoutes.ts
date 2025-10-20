import { Router, Response, Request } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { isAuthorized, isSuperAdmin } from "../middlewares/requireAuth";
import {
  canManageOrganization,
  validateCreateOrg,
  validateOrgId,
} from "src/middlewares/organizationMiddleware";
import { asyncHandler } from "src/lib/helpers/asyncHandler";
import { findOrganization } from "src/lib/helpers/organisation";

interface AuthenticatedRequest extends Request {
  userId?: string;
}

const router = Router();

// Create organization
router.post(
  "/",
  isAuthorized,
  validateCreateOrg,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { name, slug } = req.body;

    const existing = await prisma.organization.findUnique({
      where: { slug },
    });
    if (existing) {
      return res.status(409).json({ error: "Slug already in use" });
    }

    const data = await auth.api.createOrganization({
      body: { name, slug },
      headers: fromNodeHeaders(req.headers),
    });

    res.status(201).json({ data });
  })
);

// Get all organizations (SuperAdmin only)
router.get(
  "/",
  isAuthorized,
  isSuperAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const data = await prisma.organization.findMany();
    res.status(200).json({ data });
  })
);

// Get organization by ID
router.get(
  "/:id",
  isAuthorized,
  validateOrgId,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.userId;

    if (!id || !userId) {
      return res.status(400).json({ error: "Invalid request" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const organization = await prisma.organization.findFirst({
      where:
        user.role === "SUPER_ADMIN"
          ? { id }
          : {
              id,
              members: { some: { userId } },
            },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                image: true,
              },
            },
          },
        },
      },
    });

    if (!organization) {
      return res
        .status(404)
        .json({ error: "Organization not found or no access" });
    }

    res.status(200).json({ organization });
  })
);

router.delete(
  "/:id",
  isAuthorized,
  isSuperAdmin,
  validateOrgId,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const organization = await findOrganization(id);
    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }

    await prisma.organization.delete({ where: { id } });
    res.status(200).json({ message: "Successfully deleted" });
  })
);

router.put(
  "/:id",
  isAuthorized,
  validateOrgId,
  canManageOrganization,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    //

    const { id } = req.params;
    const { name, slug, logo, metadata } = req.body;

    const organization = await findOrganization(id);

    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }

    const data: any = {};
    if (name) data.name = name;
    if (slug) data.slug = slug;
    if (logo) data.logo = logo;
    if (metadata) data.metadata = metadata;

    const updated = await prisma.organization.update({
      where: { id },
      data,
    });

    res.json({ organization: updated });
  })
);

router.get(
  "/:id/members",
  isAuthorized,
  validateOrgId,
  canManageOrganization,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const organization = await findOrganization(id);
    if (!organization)
      return res.status(404).json({ error: "Organization not found" });
    const members = await prisma.member.findMany({
      where: { organizationId: id },
    });
    return res.status(200).json({ members });
  })
);

export default router;
