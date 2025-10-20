import { Router, Response, Request } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { isAuthorized, isSuperAdmin } from "../middlewares/requireAuth";

interface AuthenticatedRequest extends Request {
  userId?: string;
}

const router = Router();

// Create organization
router.post(
  "/",
  isAuthorized,
  async (req: AuthenticatedRequest, res: Response) => {
    const { name, slug } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: "Name and slug are required" });
    }

    try {
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
    } catch (error) {
      console.error("Error creating organization:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get all organizations (SuperAdmin only)
router.get("/", isAuthorized, isSuperAdmin, async (_req, res) => {
  try {
    const data = await prisma.organization.findMany();
    res.status(200).json({ data });
  } catch (error) {
    console.error("Error fetching organizations:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get organization by ID
router.get(
  "/:id",
  isAuthorized,
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.userId;

    if (!id || !userId) {
      return res.status(400).json({ error: "Invalid request" });
    }

    try {
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
    } catch (error) {
      console.error("Error fetching organization:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
