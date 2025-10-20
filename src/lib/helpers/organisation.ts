import { prisma } from "../prisma";

export async function findOrganization(id: string) {
  return prisma.organization.findUnique({ where: { id } });
}
