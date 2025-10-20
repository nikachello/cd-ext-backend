// tests/setup/prismaMock.ts
import { mockDeep, DeepMockProxy } from "jest-mock-extended";
import { PrismaClient } from "@prisma/client";

const prismaMock: DeepMockProxy<PrismaClient> = mockDeep<PrismaClient>();

export default prismaMock;
