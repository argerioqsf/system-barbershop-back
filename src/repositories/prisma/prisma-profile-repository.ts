import { prisma } from '@/lib/prisma'
import {
  Cycle,
  ExtractProfile,
  Leads,
  Organization,
  Prisma,
  Profile,
  Unit,
  User,
} from '@prisma/client'
import { ProfilesRepository } from '../profiles-repository'

export class PrismaProfilesRepository implements ProfilesRepository {
  async update(id: string, data: Prisma.ProfileUpdateInput): Promise<Profile> {
    const profile = await prisma.profile.update({
      where: {
        id,
      },
      data,
    })

    return profile
  }

  async confirmPayment(
    id: string,
    data: Prisma.ProfileUpdateInput,
    extract: Prisma.ExtractProfileUncheckedCreateInput,
  ): Promise<{ profile: Profile; extract: ExtractProfile }> {
    const [profile, NewExtract] = await prisma.$transaction([
      prisma.profile.update({
        where: {
          id,
        },
        data,
      }),
      prisma.extractProfile.create({ data: extract }),
    ])

    return { profile, extract: NewExtract }
  }

  async findById(id: string): Promise<(Profile & { user: User }) | null> {
    const profile = await prisma.profile.findUnique({
      where: { id },
      include: {
        user: true,
      },
    })

    return profile
  }

  async findByUserId(id: string): Promise<
    | (Omit<Profile, 'userId'> & {
        extract_profile: ExtractProfile[]
        user: Omit<
          User & {
            organizations: {
              organization: Organization & {
                cycles: (Cycle & { leads: Leads[] })[]
              }
            }[]
          },
          'password'
        >
      } & {
        units: { unit: Unit }[]
      })
    | null
  > {
    const profile = await prisma.profile.findUnique({
      where: { userId: id },
      select: {
        id: true,
        phone: true,
        cpf: true,
        genre: true,
        birthday: true,
        pix: true,
        role: true,
        userId: true,
        city: true,
        amountToReceive: true,
        extract_profile: true,
        units: {
          select: {
            unit: true,
          },
        },
        _count: {
          select: {
            leadsIndicator: {
              where: { documents: true },
            },
            leadsConsultant: {
              where: { documents: true },
            },
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            active: true,
            organizations: {
              select: {
                organization: {
                  select: {
                    id: true,
                    name: true,
                    consultant_bonus: true,
                    indicator_bonus: true,
                    slug: true,
                    cycles: {
                      select: {
                        id: true,
                        start_cycle: true,
                        end_cycle: true,
                        organizationId: true,
                        leads: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    return profile
  }

  async create(data: Prisma.ProfileUncheckedCreateInput): Promise<Profile> {
    const user = await prisma.profile.create({ data })

    return user
  }

  async findMany(
    where?: Prisma.ProfileWhereInput,
    orderBy?: Prisma.ProfileOrderByWithRelationInput,
  ): Promise<
    (Profile & {
      user: User
      leadsConsultant: Leads[]
      leadsIndicator: Leads[]
    })[]
  > {
    const profiles = await prisma.profile.findMany({
      where: {
        ...where,
      },
      include: {
        leadsConsultant: true,
        leadsIndicator: true,
        user: true,
      },
      orderBy: {
        ...orderBy,
      },
    })

    return profiles
  }
}
