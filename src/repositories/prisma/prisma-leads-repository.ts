import { Leads, Prisma } from '@prisma/client'
import { LeadsRepository } from '../leads-repository'
import { prisma } from '@/lib/prisma'
import { pagination } from '@/utils/constants/pagination'

export class PrismaLeadsRepository implements LeadsRepository {
  updateById(id: string, data: Prisma.LeadsUpdateInput): Promise<Leads> {
    const lead = prisma.leads.update({
      where: {
        id,
      },
      data,
    })

    return lead
  }

  async findById(id: string): Promise<Leads | null> {
    const lead = await prisma.leads.findUnique({
      where: {
        id,
      },
      include: {
        consultant: {
          select: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            phone: true,
            cpf: true,
          },
        },
        indicator: {
          select: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            phone: true,
            cpf: true,
          },
        },
      },
    })

    return lead
  }

  async findMany(page: number, query?: string): Promise<Leads[]> {
    const leads = await prisma.leads.findMany({
      where: {
        name: {
          contains: query,
        },
      },
      include: {
        consultant: {
          select: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            phone: true,
            cpf: true,
          },
        },
        indicator: {
          select: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            phone: true,
            cpf: true,
          },
        },
      },
      take: pagination.total,
      skip: (page - 1) * pagination.total,
    })

    return leads
  }

  async count(query?: string): Promise<number> {
    const leads = await prisma.leads.count({
      where: {
        name: {
          contains: query,
        },
      },
    })

    return leads
  }

  async create(data: Prisma.LeadsUncheckedCreateInput): Promise<Leads> {
    const leads = await prisma.leads.create({ data })

    return leads
  }
}
