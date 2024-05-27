import { Leads, Prisma } from '@prisma/client'
import { LeadsRepository } from '../leads-repository'
import { prisma } from '@/lib/prisma'
import { pagination } from '@/utils/constants/pagination'

export class PrismaLeadsRepository implements LeadsRepository {
  updateById(
    id: string,
    data: Prisma.LeadsUncheckedUpdateInput,
  ): Promise<Leads> {
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
        timeline: true,
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

  async findManyArchived(
    page: number,
    query?: string,
    indicatorId?: string,
    consultantId?: string,
  ): Promise<Leads[]> {
    const whereIndicatorId = indicatorId
      ? {
          indicatorId: { contains: indicatorId },
        }
      : {}
    const whereConsultantId = consultantId
      ? {
          consultantId: { contains: consultantId },
        }
      : {}
    const leads = await prisma.leads.findMany({
      where: {
        ...whereIndicatorId,
        ...whereConsultantId,
        archived: true,
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

  async findMany(
    page: number,
    query?: string,
    indicatorId?: string,
    consultantId?: string,
    unitsId?: string[],
  ): Promise<Leads[]> {
    const whereIndicatorId = indicatorId
      ? {
          indicatorId: { contains: indicatorId },
        }
      : {}
    const whereConsultantId = consultantId
      ? {
          consultantId: { contains: consultantId },
        }
      : {}
    const whereUnitsId = unitsId
      ? {
          unitId: { in: unitsId },
        }
      : {}
    const leads = await prisma.leads.findMany({
      where: {
        ...whereIndicatorId,
        ...whereConsultantId,
        ...whereUnitsId,
        archived: false,
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

  async count(query?: string, unitsId?: string[]): Promise<number> {
    const whereUnitsId = unitsId
      ? {
          unitId: { in: unitsId },
        }
      : {}
    const leads = await prisma.leads.count({
      where: {
        ...whereUnitsId,
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
