// tests/setup/global.d.ts
import { DeepMockProxy } from "jest-mock-extended";
import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prismaMock: DeepMockProxy<PrismaClient>;
}

export {};
