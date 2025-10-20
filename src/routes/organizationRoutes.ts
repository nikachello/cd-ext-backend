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
    console.log(req);
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

// POST /:id/members
router.post(
  "/:id/members",
  isAuthorized,
  validateOrgId,
  canManageOrganization,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params; // organization id
    const { userId, role } = req.body; // role required by better-auth

    if (!userId || !role) {
      return res.status(400).json({ error: "userId and role are required" });
    }

    // Optionally validate user exists in your DB
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Use better-auth server API to add the member (server-only API)
    try {
      const data = await auth.api.addMember({
        body: {
          userId,
          role, // e.g. "admin" | "member" or custom roles you defined
          organizationId: id,
        },
      });

      // Optionally mirror membership in your own Prisma table if you need a local copy:
      // await prisma.member.create({ data: { organizationId: id, userId, role } });

      return res.status(201).json({ data });
    } catch (err: any) {
      // better-auth returns useful errors (403, 409, ...)
      return res
        .status(err?.status || 500)
        .json({ error: err?.message || "Failed to add member" });
    }
  })
);

router.delete(
  "/:id/members",
  isAuthorized,
  validateOrgId,
  canManageOrganization,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { userId } = req.body;
    if (!userId || !id)
      return res.status(400).json({ error: "userId and orgId are required" });

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) return res.status(404).json({ error: "User not found" });

    const org = await prisma.organization.findUnique({ where: { id: id } });

    if (!org) return res.status(404).json({ error: "Organization not found" });

    try {
      console.log("removing user: ", userId);
      const data = await auth.api.removeMember({
        body: {
          memberIdOrEmail: user.email, // required
          organizationId: id,
        },
        headers: fromNodeHeaders(req.headers),
      });

      return res.status(200).json({ data });
    } catch (error: any) {
      console.log("error:", error);
      return res
        .status(error?.statusCode || 500)
        .json({ error: error?.body?.message || "Failed to remove member" });
    }
  })
);

// TODO: Create role changing endpoint

export default router;
