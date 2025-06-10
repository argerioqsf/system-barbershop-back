import { Prisma, Organization } from "@prisma/client";

export interface OrganizationRepository {
  create(data: Prisma.OrganizationCreateInput): Promise<Organization>;
  findById(id: string): Promise<Organization | null>;
  findMany(): Promise<Organization[]>;
}
