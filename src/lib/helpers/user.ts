import { prisma } from "../prisma";

async function getUserRole(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
}
