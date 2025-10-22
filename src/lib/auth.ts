import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { bearer, organization } from "better-auth/plugins";

const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "sqlite",
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    bearer(),
    organization({
      allowUserToCreateOrganization: async (user) => {
        try {
          const userData = await prisma.user.findUnique({
            where: { id: user.id },
            select: { role: true },
          });
          return userData?.role === "SUPER_ADMIN";
        } catch (error) {
          return false;
        }
      },
    }),
  ],
  trustedOrigins: [
    "chrome-extension://ilhkfbhlcodigfjhohdnlblpkllboioa",
    "http://localhost:3000",
    "http://localhost:3005",
    "https://app.centraldispatch.com",
    "https://cd-ext-backend.onrender.com",
    "http://localhost:3001",
    "https://central-super-hpuhcut2t-nikachellos-projects.vercel.app",
    "https://central-super.vercel.app",
  ],
  defaultCookieAttributes: {
    sameSite: "none",
    secure: true,
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
  // Add this advanced configuration
});

console.log("🍪 Better Auth cookie config:", auth); // Add this
