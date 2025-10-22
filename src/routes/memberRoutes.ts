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

router.post(
  "/toggle-extension",
  isAuthorized,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
  })
);

export default router;
