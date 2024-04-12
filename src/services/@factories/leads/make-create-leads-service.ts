import { PrismaLeadsRepository } from "@/repositories/prisma/prisma-leads-repository";
import { PrismaUsersRepository } from "@/repositories/prisma/prisma-users-repository";
import { CreateLeadsService } from "@/services/leads/create-leads-service";

export default function makeCreateLeadsService() {
  return new CreateLeadsService(new PrismaLeadsRepository());
}
