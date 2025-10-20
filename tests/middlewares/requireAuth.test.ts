import { isAuthorized } from "../../src/middlewares/requireAuth";
import { Request, Response, NextFunction } from "express";

jest.mock("better-auth", () => ({
  betterAuth: jest.fn(() => ({
    api: {
      getSession: jest.fn(() => Promise.resolve({ session: null })),
    },
  })),
}));

describe("isAuthorized", () => {
  it("should return 401 if no session found", async () => {
    const req = { headers: {} } as Request;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
    const next = jest.fn();

    await isAuthorized(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Invalid or expired session",
    });
    expect(next).not.toHaveBeenCalled();
  });
});
