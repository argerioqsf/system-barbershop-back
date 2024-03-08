import { PrismaProfilesRepository } from "@/repositories/prisma/prisma-profile-repository";
import { GetUserProfileService } from "../get-user-profile-service";

export function makeProfileService() {
  return new GetUserProfileService(new PrismaProfilesRepository());
}
