import { Router, Response } from "express";
import { asyncHandler } from "src/lib/helpers/asyncHandler";
import { isAuthorized, isSuperAdmin } from "src/middlewares/requireAuth";
import { AuthenticatedRequest } from "src/types/requestTypes";
import { prisma } from "../lib/prisma";

const router = Router();

// GET all plans with active subscriber counts
router.get(
  "/",
  isAuthorized,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const plans = await prisma.plan.findMany({
      include: {
        CompanySubscription: {
          where: { status: "ACTIVE" },
          select: { id: true },
        },
      },
    });

    const formatted = plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      pricePerSeat: plan.pricePerSeat,
      features: plan.features,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
      activeSubscribers: plan.CompanySubscription.length,
    }));

    return res.status(200).json({ plans: formatted });
  })
);

// GET single plan by ID with active subscriber count
router.get(
  "/:planId",
  isAuthorized,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { planId } = req.params;

    if (!planId) {
      return res.status(400).json({ message: "Plan ID is required" });
    }

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      include: {
        CompanySubscription: {
          where: { status: "ACTIVE" },
          select: { id: true },
        },
      },
    });

    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    const formatted = {
      id: plan.id,
      name: plan.name,
      pricePerSeat: plan.pricePerSeat,
      features: plan.features,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
      activeSubscribers: plan.CompanySubscription.length,
    };

    return res.status(200).json({ plan: formatted });
  })
);

// CREATE plan
router.post(
  "/",
  isAuthorized,
  isSuperAdmin,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { name, pricePerSeat, features } = req.body;

    if (!name || typeof pricePerSeat !== "number" || !Array.isArray(features)) {
      return res.status(400).json({
        message:
          "Invalid input: Name (string), Price Per Seat (number), Features (array) are required",
      });
    }

    //check for duplicate name
    const existing = await prisma.plan.findFirst({ where: { name } });
    if (existing)
      return res.status(409).json({ message: "Plan already exists" });

    const plan = await prisma.plan.create({
      data: {
        name: name.trim(),
        pricePerSeat,
        features,
      },
    });

    return res.status(201).json({ plan });
  })
);

// UPDATE plan
router.patch(
  "/:planId",
  isAuthorized,
  isSuperAdmin,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { planId } = req.params;
    const { name, pricePerSeat, features } = req.body;

    if (!planId)
      return res.status(400).json({ message: "Plan ID is required" });

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) return res.status(404).json({ message: "Plan not found" });

    const updatedPlan = await prisma.plan.update({
      where: { id: planId },
      data: {
        ...(name && { name: name.trim() }),
        ...(typeof pricePerSeat === "number" && { pricePerSeat }),
        ...(Array.isArray(features) && { features }),
      },
    });

    return res.status(200).json({ plan: updatedPlan });
  })
);

// DELETE plan
router.delete(
  "/:planId",
  isAuthorized,
  isSuperAdmin,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { planId } = req.params;

    if (!planId)
      return res.status(400).json({ message: "Plan ID is required" });

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) return res.status(404).json({ message: "Plan not found" });

    await prisma.plan.delete({ where: { id: planId } });

    return res.status(204).send();
  })
);

export default router;
