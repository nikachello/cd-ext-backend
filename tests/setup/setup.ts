process.env.NODE_ENV = "test";

// if using Prisma mock
import prismaMock from "./prismaMock";
global.prismaMock = prismaMock;

afterEach(async () => {
  jest.clearAllMocks();
});

jest.mock("better-auth");
jest.mock("better-auth/adapters/prisma");
