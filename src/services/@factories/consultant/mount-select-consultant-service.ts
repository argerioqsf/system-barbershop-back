import { PrismaUsersRepository } from "@/repositories/prisma/prisma-users-repository";
import { MountSelectConsultantService } from "@/services/consultant/mount-select-consultant-service";

export function makeMountSelectConsultantService() {
  return new MountSelectConsultantService(new PrismaUsersRepository());
}
