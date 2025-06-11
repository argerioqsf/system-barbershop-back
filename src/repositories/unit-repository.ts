import { Prisma, Unit } from "@prisma/client";

export interface UnitRepository {
  create(data: Prisma.UnitCreateInput): Promise<Unit>;
  findById(id: string): Promise<Unit | null>;
  findManyByOrganization(organizationId: string): Promise<Unit[]>;
  update(id: string, data: Prisma.UnitUpdateInput): Promise<Unit>;
  delete(id: string): Promise<void>;
}
