import { Leads, Prisma, Timeline } from '@prisma/client'
import { LeadsRepository } from '../leads-repository'
import { prisma } from '@/lib/prisma'
import { pagination } from '@/utils/constants/pagination'

export class PrismaLeadsRepository implements LeadsRepository {
  updateById(
    id: string,
    data: Prisma.LeadsUncheckedUpdateInput,
    timeline: Omit<Timeline, 'id' | 'leadsId' | 'createdAt' | 'updatedAt'>[],
  ): Promise<Leads> {
    const lead = prisma.leads.update({
      where: {
        id,
      },
      data: {
        ...data,
        timeline: {
          create: [...timeline],
        },
      },
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
        unit: true,
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
        timeline: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    return lead
  }

  async find(where: Partial<Leads>): Promise<Leads[]> {
    const lead = await prisma.leads.findMany({
      where,
    })

    return lead
  }

  async findMany(
    page: number,
    where: Prisma.LeadsWhereInput,
  ): Promise<Leads[]> {
    const leads = await prisma.leads.findMany({
      where: {
        ...where,
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

  async count(where: Prisma.LeadsWhereInput): Promise<number> {
    const leads = await prisma.leads.count({
      where: {
        ...where,
      },
    })

    return leads
  }

  async create(
    data: Prisma.LeadsUncheckedCreateInput,
    timeline: Omit<Timeline, 'id' | 'leadsId' | 'createdAt' | 'updatedAt'>[],
  ): Promise<Leads> {
    const leads = await prisma.leads.create({
      data: {
        ...data,
        timeline: {
          create: [...timeline],
        },
      },
    })

    return leads
  }

  async mountSelect(
    where: Prisma.LeadsWhereInput,
  ): Promise<(Leads & { timeline: Timeline[] })[]> {
    const leads = await prisma.leads.findMany({
      where: {
        ...where,
      },
      include: {
        timeline: true,
      },
    })

    return leads
  }
}
