// Mock BOTH middlewares
jest.mock("../../src/middlewares/requireAuth", () => ({
  isAuthorized: (_req: any, _res: any, next: any) => next(),
  isSuperAdmin: (_req: any, _res: any, next: any) => next(),
}));

import app from "src/app";
import request from "supertest";

describe("POST /api/organisations", () => {
  it("should return 400 when missing fields", async () => {
    const res = await request(app).post("/api/organisations").send({});
    expect(res.status).toBe(400);
  });
});
