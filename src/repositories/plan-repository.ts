import { Plan, Prisma } from '@prisma/client'

export interface PlanRepository {
  findById(id: string): Promise<Plan | null>
  create(data: Prisma.PlanCreateInput): Promise<Plan>
  update(id: string, data: Prisma.PlanUpdateInput): Promise<Plan>
  findMany(where?: Prisma.PlanWhereInput): Promise<Plan[]>
}
