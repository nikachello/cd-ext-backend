import request from "supertest";
import app from "../../src/app";

// ---------------- MOCK MIDDLEWARES ----------------
let mockUser: any = { id: "mock-user-id", role: "SUPER_ADMIN" };

jest.mock("../../src/middlewares/requireAuth", () => ({
  isAuthorized: (req: any, res: any, next: any) => {
    if (!mockUser) return res.status(400).json({ error: "Unauthorized" });
    req.user = mockUser;
    req.userId = mockUser.id;
    next();
  },
  isSuperAdmin: (req: any, res: any, next: any) => {
    if (!mockUser) return res.status(400).json({ error: "Unauthorized" });
    if (mockUser.role !== "SUPER_ADMIN") {
      return res.status(403).json({ error: "Forbidden" });
    }
    req.user = mockUser;
    req.userId = mockUser.id;
    next();
  },
}));

// DON'T mock organizationMiddleware - let the real middleware run
// It will use our mocked Prisma client

// ---------------- MOCK PRISMA ----------------
const mockFindUnique = jest.fn();
const mockFindMany = jest.fn();
const mockFindFirst = jest.fn();
const mockDelete = jest.fn();
const mockUpdate = jest.fn();

const mockFindMembers = jest.fn();
const mockMemberFindFirst = jest.fn();

const mockUserFindUnique = jest.fn();

jest.mock("../../src/lib/prisma", () => ({
  prisma: {
    organization: {
      findUnique: (...args: any[]) => mockFindUnique(...args),
      findMany: (...args: any[]) => mockFindMany(...args),
      findFirst: (...args: any[]) => mockFindFirst(...args),
      delete: (...args: any[]) => mockDelete(...args),
      update: (...args: any[]) => mockUpdate(...args),
    },
    user: {
      findUnique: (...args: any[]) => mockUserFindUnique(...args),
    },
    member: {
      findFirst: (...args: any[]) => mockMemberFindFirst(...args),
      findMany: (...args: any[]) => mockFindMembers(...args),
    },
  },
}));

// ---------------- MOCK AUTH SERVICE ----------------
const mockCreateOrganization = jest.fn();

jest.mock("../../src/lib/auth", () => ({
  auth: {
    api: {
      createOrganization: (...args: any[]) => mockCreateOrganization(...args),
    },
  },
}));

// ---------------- MOCK findOrganization HELPER ----------------
jest.mock("../../src/lib/helpers/organisation", () => ({
  findOrganization: (id: string) => {
    return mockFindUnique({ where: { id } });
  },
}));

// ---------------- TESTS ----------------
describe("Organization API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { id: "mock-user-id", role: "SUPER_ADMIN" };
  });

  // -------- POST /api/organizations --------
  describe("POST /api/organizations", () => {
    it("should return 400 when missing required fields", async () => {
      const res = await request(app).post("/api/organizations").send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Name and slug are required");
    });

    it("should return 409 if slug already exists", async () => {
      mockFindUnique.mockResolvedValueOnce({ id: "1", slug: "existing-slug" });

      const res = await request(app)
        .post("/api/organizations")
        .send({ name: "Org1", slug: "existing-slug" });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe("Slug already in use");
    });

    it("should successfully create organization", async () => {
      mockFindUnique.mockResolvedValueOnce(null);
      mockCreateOrganization.mockResolvedValueOnce({
        name: "Test Org",
        slug: "test-org",
      });

      const res = await request(app)
        .post("/api/organizations")
        .send({ name: "Test Org", slug: "test-org" });

      expect(res.status).toBe(201);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.name).toBe("Test Org");
    });
  });

  // -------- GET /api/organizations --------
  describe("GET /api/organizations", () => {
    it("should return all organizations for superadmin", async () => {
      mockFindMany.mockResolvedValueOnce([
        { id: "1", name: "Org1" },
        { id: "2", name: "Org2" },
      ]);

      const res = await request(app).get("/api/organizations");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);
    });

    it("should return 400 if user is not logged in", async () => {
      mockUser = null;

      const res = await request(app).get("/api/organizations");
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/unauthorized/i);
    });
  });

  // -------- GET /api/organizations/:id --------
  describe("GET /api/organizations/:id", () => {
    it("should return 404 if organization not found", async () => {
      const nonExistentId = "non-existent-id";
      mockUserFindUnique.mockResolvedValueOnce({ role: "USER" });
      mockFindFirst.mockResolvedValueOnce(null);

      const res = await request(app).get(`/api/organizations/${nonExistentId}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/not found|no access/i);
    });

    it("should return 400 if user is not logged in", async () => {
      mockUser = null;

      const res = await request(app).get("/api/organizations/some-id");
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/unauthorized/i);
    });
  });

  // -------- DELETE /api/organizations/:id --------
  describe("DELETE /api/organizations/:id", () => {
    it("should delete organization successfully", async () => {
      mockFindUnique.mockResolvedValueOnce({ id: "org-to-delete" });
      mockDelete.mockResolvedValueOnce({ id: "org-to-delete" });

      const res = await request(app).delete("/api/organizations/org-to-delete");

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Successfully deleted");
    });

    it("should return 400 if user is not logged in", async () => {
      mockUser = null;

      const res = await request(app).delete("/api/organizations/org-to-delete");
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/unauthorized/i);
    });
  });

  // -------- PUT /api/organizations/:id --------
  describe("PUT /api/organizations/:id", () => {
    it("returns 404 if organization does not exist", async () => {
      mockUserFindUnique.mockResolvedValue({
        id: "mock-user-id",
        role: "SUPER_ADMIN",
      });
      mockFindUnique.mockResolvedValueOnce(null);

      const res = await request(app)
        .put("/api/organizations/non-existent-id")
        .send({});

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Organization not found");
    });

    it("updates all fields successfully", async () => {
      const org = {
        id: "org-123",
        name: "Old",
        slug: "old-slug",
        logo: "old.png",
        metadata: {},
      };
      const updatedOrg = {
        ...org,
        name: "New",
        slug: "new-slug",
        logo: "new.png",
        metadata: { foo: "bar" },
      };

      mockUserFindUnique.mockResolvedValue({
        id: "mock-user-id",
        role: "SUPER_ADMIN",
      });
      mockFindUnique.mockResolvedValueOnce(org);
      mockUpdate.mockResolvedValueOnce(updatedOrg);

      const res = await request(app)
        .put("/api/organizations/org-123")
        .send({
          name: "New",
          slug: "new-slug",
          logo: "new.png",
          metadata: { foo: "bar" },
        });

      expect(res.status).toBe(200);
      expect(res.body.organization).toEqual(updatedOrg);
    });

    it("updates only provided fields", async () => {
      const org = {
        id: "org-123",
        name: "Old",
        slug: "old-slug",
        logo: "old.png",
        metadata: {},
      };
      const updatedOrg = { ...org, slug: "new-slug" };

      mockUserFindUnique.mockResolvedValue({
        id: "mock-user-id",
        role: "SUPER_ADMIN",
      });
      mockFindUnique.mockResolvedValueOnce(org);
      mockUpdate.mockResolvedValueOnce(updatedOrg);

      const res = await request(app)
        .put("/api/organizations/org-123")
        .send({ slug: "new-slug" })
        .set("Authorization", "Bearer token");

      expect(res.status).toBe(200);
      expect(res.body.organization.slug).toBe("new-slug");
      expect(res.body.organization.name).toBe("Old");
    });

    it("returns 400 if user is not logged in", async () => {
      mockUser = null;

      const res = await request(app)
        .put("/api/organizations/org-123")
        .send({ name: "New Name" });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/unauthorized/i);
    });

    it("does not fail if body is empty but organization exists", async () => {
      const org = { id: "org-123", name: "Old", slug: "old-slug" };

      mockUserFindUnique.mockResolvedValue({
        id: "mock-user-id",
        role: "SUPER_ADMIN",
      });
      mockFindUnique.mockResolvedValueOnce(org);
      mockUpdate.mockResolvedValueOnce(org);

      const res = await request(app)
        .put("/api/organizations/org-123")
        .send({})
        .set("Authorization", "Bearer token");

      expect(res.status).toBe(200);
      expect(res.body.organization).toEqual(org);
    });
  });

  // -------- GET /api/organizations/:id/members --------
  describe("GET /api/organizations/:id/members", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockUser = { id: "mock-user-id", role: "SUPER_ADMIN" };
    });

    it("returns 400 if user is not logged in", async () => {
      mockUser = null;

      const res = await request(app).get("/api/organizations/org-123/members");
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/unauthorized/i);
    });

    it("returns 404 if organization is not found", async () => {
      mockUserFindUnique.mockResolvedValueOnce({
        id: "mock-user-id",
        role: "SUPER_ADMIN",
      });
      mockFindUnique.mockResolvedValueOnce(null);

      const res = await request(app).get(
        "/api/organizations/non-existed-org/members"
      );
      expect(res.status).toBe(404);
    });

    it("allows SUPER_ADMIN to see members", async () => {
      mockUser = { id: "superadmin-id", role: "SUPER_ADMIN" };
      mockUserFindUnique.mockResolvedValueOnce({
        id: "superadmin-id",
        role: "SUPER_ADMIN",
      });
      mockFindUnique.mockResolvedValueOnce({ id: "org-123", name: "Org1" });
      mockFindMembers.mockResolvedValueOnce([
        { id: "member-1", userId: "u1", role: "USER" },
        { id: "member-2", userId: "u2", role: "MANAGER" },
      ]);

      const res = await request(app).get("/api/organizations/org-123/members");

      expect(res.status).toBe(200);
      expect(res.body.members.length).toBe(2);
    });

    it("allows MANAGER of the organization to see members", async () => {
      mockUser = { id: "manager-id", role: "USER" };
      mockUserFindUnique.mockResolvedValueOnce({
        id: "manager-id",
        role: "USER",
      });
      mockMemberFindFirst.mockResolvedValueOnce({
        organizationId: "org-123",
        userId: "manager-id",
        role: "MANAGER",
      });
      mockFindUnique.mockResolvedValueOnce({ id: "org-123", name: "Org1" });
      mockFindMembers.mockResolvedValueOnce([
        { id: "member-1", userId: "u1", role: "USER" },
      ]);

      const res = await request(app).get("/api/organizations/org-123/members");

      expect(res.status).toBe(200);
      expect(res.body.members.length).toBe(1);
    });

    it("returns 403 if user is not manager or SUPER_ADMIN", async () => {
      mockUser = { id: "user-id", role: "USER" };

      // canManageOrganization middleware checks:
      // 1. Find the user
      mockUserFindUnique.mockResolvedValueOnce({ id: "user-id", role: "USER" });

      // 2. Check if user is a member with MANAGER/ADMIN role - returns null (not a manager)
      mockMemberFindFirst.mockResolvedValueOnce(null);

      const res = await request(app).get("/api/organizations/org-123/members");

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/access denied/i);
    });

    it("returns empty array if organization has no members", async () => {
      mockUser = { id: "superadmin-id", role: "SUPER_ADMIN" };
      mockUserFindUnique.mockResolvedValueOnce({
        id: "superadmin-id",
        role: "SUPER_ADMIN",
      });
      mockFindUnique.mockResolvedValueOnce({ id: "org-123", name: "Org1" });
      mockFindMembers.mockResolvedValueOnce([]);

      const res = await request(app).get("/api/organizations/org-123/members");

      expect(res.status).toBe(200);
      expect(res.body.members).toEqual([]);
    });
  });
});
