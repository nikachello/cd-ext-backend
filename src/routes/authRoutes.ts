import { Router, Request, Response } from "express";

const router = Router();

// Catch all routes under /api/auth/*
router.all("/{*any}", (req: Request, res: Response) => {});

export default router;
