import { Prisma, Unit } from "@prisma/client";

export interface UnitRepository {
  create(data: Prisma.UnitCreateInput): Promise<Unit>;
  findById(id: string): Promise<Unit | null>;
  findManyByOrganization(organizationId: string): Promise<Unit[]>;
}
