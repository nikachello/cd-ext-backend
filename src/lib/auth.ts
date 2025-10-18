import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
// If your Prisma file is located elsewhere, you can change the path
import { PrismaClient } from "@prisma/client";
import { bearer, organization } from "better-auth/plugins";

const prisma = new PrismaClient();
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "sqlite", // or "mysql", "postgresql", ...etc
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [bearer(), organization()],
  trustedOrigins: [
    "chrome-extension://ilhkfbhlcodigfjhohdnlblpkllboioa",
    "http://localhost:3000",
    "http://localhost:3005",
    "https://app.centraldispatch.com",
    "https://cd-ext-backend.onrender.com",
    "http://localhost:3001",
  ],

  allowedOrigins: [
    "chrome-extension://ilhkfbhlcodigfjhohdnlblpkllboioa",
    "http://localhost:3000",
    "http://localhost:3005",
    "https://app.centraldispatch.com", // optional, for web dev
    "https://cd-ext-backend.onrender.com",
    "http://localhost:3001",
  ],
});
