// routes/authRoutes.ts
import { Router } from "express";
import cors from "cors";
import { corsOptionsDelegate } from "../middlewares/corsMiddleware";
import { toNodeHandler } from "better-auth/node";
import { auth } from "../lib/auth";

const router = Router();

router.use(cors(corsOptionsDelegate));

router.all("/{*any}", toNodeHandler(auth));

export default router;
