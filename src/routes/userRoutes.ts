import { Router, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth";
import { asyncHandler } from "src/lib/helpers/asyncHandler";
import { isAuthorized } from "src/middlewares/requireAuth";
import { AuthenticatedRequest } from "src/types/requestTypes";
import { prisma } from "../lib/prisma";

const router = Router();

router.get(
  "/me",
  isAuthorized,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.userId;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          role: true,
          emailVerified: true,
        },
      });

      if (!user) return res.status(404).json({ message: "User not found" });

      const membership = await prisma.member.findFirst({
        where: { userId },
        select: {
          role: true,
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
              createdAt: true,
            },
          },
        },
      });

      return res.status(200).json({
        user,
        organization: membership?.organization || null,
        role: membership?.role || null,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch user info" });
    }
  })
);

export default router;
