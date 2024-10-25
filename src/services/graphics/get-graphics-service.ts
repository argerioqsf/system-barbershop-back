import { CourseNotFoundError } from '../@errors/course-not-found-error'
import { LeadsRepository } from '@/repositories/leads-repository'
import { CycleRepository } from '@/repositories/cycle-repository'
import { UsersRepository } from '@/repositories/users-repository'
import { Prisma } from '@prisma/client'
import { TimelineRepository } from '@/repositories/timeline-repository'

type Graphics = {
  leads_per_day?: {
    value: number
    diff: number
  }
  leads_per_cycle?: {
    value: number
    diff: number
  }
  average_service_time?: {
    horas: number
    minutos: number
    segundos: number
  }
  totalLeads?: number
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
      let where: Prisma.LeadsWhereInput = {
        createdAt: {
          gte: yesterdayStart,
          lt: yesterdayEnd,
        },
      }
      if (
        user?.profile?.role === 'indicator' ||
        user?.profile?.role === 'consultant'
      ) {
        where = {
          ...where,
          indicatorId: user?.profile?.id,
        }
      }
      const leads_per_yesterday = await this.leadsRepository.count(where)
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

      let where: Prisma.LeadsWhereInput = {}
      if (
        user?.profile?.role === 'indicator' ||
        user?.profile?.role === 'consultant'
      ) {
        where = {
          indicatorId: user?.profile?.id,
        }
      }

      if (current_cycle && current_cycle[0]) {
        leads_per_cycle_current = await this.leadsRepository.count({
          createdAt: {
            gte: current_cycle[0].start_cycle,
          },
          ...where,
        })
      }

      if (old_cycle && old_cycle[0]) {
        if (old_cycle[0].start_cycle && old_cycle[0].end_cycle) {
          leads_per_cycle_old = await this.leadsRepository.count({
            createdAt: {
              gte: old_cycle[0].start_cycle,
              lte: old_cycle[0].end_cycle,
            },
            ...where,
          })
        }
      }
      return { leads_per_cycle_current, leads_per_cycle_old }
    }

    const handleLeadsAverageServiceTime = async () => {
      const average_service_time = 0
      let where = {}
      if (
        user?.profile?.role === 'indicator' ||
        user?.profile?.role === 'consultant'
      ) {
        where = {
          ...where,
          indicatorId: user?.profile?.id,
        }
      }
      const leads_finalized = await this.leadsRepository.mountSelect({
        documents: true,
        ...where,
      })

      const temposDeAtendimento = []
      const temposDeAtendimentog = []

      for (const lead of leads_finalized) {
        const timeline = lead.timeline
        const novoLeadEntry = timeline.find(
          (entry) => entry.status === 'Novo Lead',
        )
        const documentsSubmittedEntry = timeline.find(
          (entry) => entry.status === 'documents_submitted',
        )

        if (novoLeadEntry && documentsSubmittedEntry) {
          const tempoDiff =
            new Date(documentsSubmittedEntry.createdAt).getTime() -
            new Date(novoLeadEntry.createdAt).getTime()
          temposDeAtendimento.push(tempoDiff)
          const mediaEmSegundos2 = tempoDiff / 1000
          temposDeAtendimentog.push({
            h: Math.floor(mediaEmSegundos2 / 3600),
            m: Math.floor((mediaEmSegundos2 % 3600) / 60),
            s: Math.floor(mediaEmSegundos2 % 60),
          })
        }
      }

      const tempoMedioAtendimento =
        temposDeAtendimento.length > 0
          ? temposDeAtendimento.reduce((acc, curr) => acc + curr, 0) /
            temposDeAtendimento.length
          : 0

      const mediaEmSegundos = tempoMedioAtendimento / 1000
      const horas = Math.floor(mediaEmSegundos / 3600)
      const minutos = Math.floor((mediaEmSegundos % 3600) / 60)
      const segundos = Math.floor(mediaEmSegundos % 60)

      return {
        average_service_time: {
          horas,
          minutos,
          segundos,
        },
        totalLeads: leads_finalized.length,
      }
    }

    if (
      profile?.role === 'indicator' ||
      profile?.role === 'consultant' ||
      profile?.role === 'administrator' ||
      profile?.role === 'coordinator'
    ) {
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

    if (profile?.role === 'administrator' || profile?.role === 'coordinator') {
      const { average_service_time, totalLeads } =
        await handleLeadsAverageServiceTime()
      graphics = {
        ...graphics,
        average_service_time,
        totalLeads,
      }
    }

    if (!graphics) throw new CourseNotFoundError()

    return { graphics }
  }
}
