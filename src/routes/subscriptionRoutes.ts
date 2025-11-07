import { Response, Router } from "express";
import { asyncHandler } from "src/lib/helpers/asyncHandler";
import { isAuthorized, isSuperAdmin } from "src/middlewares/requireAuth";
import { AuthenticatedRequest } from "src/types/requestTypes";
import { prisma } from "../lib/prisma";
const router = Router();

router.post(
  "/",
  isAuthorized,
  isSuperAdmin,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { organizationId, planId, activeSeats } = req.body;
    if (!organizationId || !planId)
      return res.status(400).json({
        message: "organizationId and planId is mandatory",
      });
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization)
      return res.status(404).json({ message: "Organization can not be found" });

    const activeSubscription = await prisma.companySubscription.findFirst({
      where: { organizationId, status: "ACTIVE" },
    });

    if (activeSubscription)
      return res
        .status(409)
        .json({ message: "Company already has an active plan" });

    const subscription = await prisma.companySubscription.create({
      data: {
        organizationId,
        planId,
        activeSeats: activeSeats ?? 0,
      },
      include: {
        organization: true,
        plan: true,
      },
    });

    return res.status(201).json({ subscription });
  })
);

export default router;
