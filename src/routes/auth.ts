import { Router, Request, Response } from "express";

const router = Router();

// Catch all routes under /api/auth/*
router.all("/{*any}", (req: Request, res: Response) => {
  // You can inspect req.method, req.path, etc.
  res.json({ message: "This is the auth API handler" });
});

export default router;
