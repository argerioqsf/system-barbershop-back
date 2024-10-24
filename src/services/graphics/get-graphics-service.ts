import { CourseNotFoundError } from '../@errors/course-not-found-error'
import { LeadsRepository } from '@/repositories/leads-repository'
import { CycleRepository } from '@/repositories/cycle-repository'
import { UsersRepository } from '@/repositories/users-repository'

type Graphics = {
  leads_per_day?: {
    value: number
    diff: number
  }
  leads_per_cycle?: {
    value: number
    diff: number
  }
}

interface GetGraphicsServiceRequest {
  userId: string
}

interface GetGraphicServiceResponse {
  graphics: Graphics
}

export class GetGraphicService {
  constructor(
    private leadsRepository: LeadsRepository,
    private userRepository: UsersRepository,
    private cycleRepository: CycleRepository,
  ) {}

  async execute({
    userId,
  }: GetGraphicsServiceRequest): Promise<GetGraphicServiceResponse> {
    const user = await this.userRepository.findById(userId)
    const profile = user?.profile
    let graphics: Graphics = {}

    const handleLeadsPerDay = async () => {
      const today = new Date()
      const todayStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      )
      const todayEnd = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 1,
      )
      const yesterday = new Date(today.getTime() - 86400000)
      const yesterdayStart = new Date(
        yesterday.getFullYear(),
        yesterday.getMonth(),
        yesterday.getDate(),
      )
      const yesterdayEnd = new Date(
        yesterday.getFullYear(),
        yesterday.getMonth(),
        yesterday.getDate() + 1,
      )
      const leads_per_day = await this.leadsRepository.count({
        createdAt: {
          gte: todayStart,
          lt: todayEnd,
        },
        indicatorId: user?.profile?.id,
      })
      const leads_per_yesterday = await this.leadsRepository.count({
        createdAt: {
          gte: yesterdayStart,
          lt: yesterdayEnd,
        },
        indicatorId: user?.profile?.id,
      })
      return { leads_per_day, leads_per_yesterday }
    }

    const handleLeadsPerCycle = async () => {
      let leads_per_cycle_current = null
      let leads_per_cycle_old = null

      const current_cycle = await this.cycleRepository.findMany({
        end_cycle: null,
      })

      const old_cycle = await this.cycleRepository.findMany({
        end_cycle: {
          not: null,
        },
      })

      if (current_cycle && current_cycle[0]) {
        leads_per_cycle_current = await this.leadsRepository.count({
          createdAt: {
            gte: current_cycle[0].start_cycle,
          },
          indicatorId: user?.profile?.id,
        })
      }

      if (old_cycle && old_cycle[0]) {
        if (old_cycle[0].start_cycle && old_cycle[0].end_cycle) {
          leads_per_cycle_old = await this.leadsRepository.count({
            createdAt: {
              gte: old_cycle[0].start_cycle,
              lte: old_cycle[0].end_cycle,
            },
            indicatorId: user?.profile?.id,
          })
        }
      }
      return { leads_per_cycle_current, leads_per_cycle_old }
    }

    if (profile?.role === 'indicator' || profile?.role === 'administrator') {
      const { leads_per_day, leads_per_yesterday } = await handleLeadsPerDay()

      const { leads_per_cycle_current, leads_per_cycle_old } =
        await handleLeadsPerCycle()

      graphics = {
        ...graphics,
        leads_per_day: {
          value: leads_per_day,
          diff: leads_per_day - leads_per_yesterday,
        },
        leads_per_cycle: {
          value: leads_per_cycle_current !== null ? leads_per_cycle_current : 0,
          diff:
            leads_per_cycle_current !== null && leads_per_cycle_old !== null
              ? leads_per_cycle_current - leads_per_cycle_old
              : 0,
        },
      }
    }

    if (!graphics) throw new CourseNotFoundError()

    return { graphics }
  }
}
