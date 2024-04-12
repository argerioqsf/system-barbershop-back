import { Leads, Prisma } from "@prisma/client";
import { LeadsRepository } from "../leads-repository";
import { prisma } from "@/lib/prisma";

export class PrismaLeadsRepository implements LeadsRepository {
  async create(data: Prisma.LeadsUncheckedCreateInput): Promise<Leads> {
    const leads = await prisma.leads.create({ data });

    return leads;
  }
}
