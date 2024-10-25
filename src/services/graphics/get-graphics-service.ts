import { CourseNotFoundError } from '../@errors/course-not-found-error'
import { LeadsRepository } from '@/repositories/leads-repository'
import { CycleRepository } from '@/repositories/cycle-repository'
import { UsersRepository } from '@/repositories/users-repository'
import { Prisma } from '@prisma/client'
import { ExtractProfileRepository } from '@/repositories/extract-profile-repository'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import { CoursesRepository } from '@/repositories/course-repository'

type ListRanking = { name: string; quant: number }

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
    totalLeads?: number
  }
  leads_by_steps?: {
    countStepClosing: number
    countStepNegotiation: number
    countStepNewLeads: number
    countStepPreService: number
    countStepPresentationOportunity: number
  }
  bonus?: {
    bonus_awaiting_confirmation: {
      total: number
      indicator: number
      consultant: number
    }
    bonus_confirmed: {
      total: number
      indicator: number
      consultant: number
    }
  }
  leadsRankingConsultant?: ListRanking[]
  leadsRankingIndicator?: ListRanking[]
  coursesRanking?: any
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
    private extractProfileRepository: ExtractProfileRepository,
    private profilesRepository: ProfilesRepository,
    private courseRepository: CoursesRepository,
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

    const handleLeadsSteps = async () => {
      let countStepNewLeads = 0
      let where: Prisma.LeadsWhereInput = {}
      if (
        user?.profile?.role === 'indicator' ||
        user?.profile?.role === 'consultant'
      ) {
        where = {
          ...where,
          indicatorId: user?.profile?.id,
        }
      }

      const groupByStepNewLeads = await this.leadsRepository.groupBySteps(
        ['released', 'consultantId'],
        {
          released: false,
          consultantId: null,
          ...where,
        },
      )
      groupByStepNewLeads.forEach((item) => {
        countStepNewLeads = countStepNewLeads + item._count.id
      })

      let countStepPreService = 0
      const groupByStepsPreService = await this.leadsRepository.groupBySteps(
        ['released', 'consultantId'],
        {
          released: true,
          consultantId: null,
          ...where,
        },
      )
      groupByStepsPreService.forEach((item) => {
        countStepPreService = countStepPreService + item._count.id
      })

      let countStepPresentationOpportunity = 0
      const groupByStepsPresentationOpportunity =
        await this.leadsRepository.groupBySteps(['released', 'consultantId'], {
          released: true,
          consultantId: {
            not: null,
          },
          matriculation: false,
          documents: false,
          ...where,
        })
      groupByStepsPresentationOpportunity.forEach((item) => {
        countStepPresentationOpportunity =
          countStepPresentationOpportunity + item._count.id
      })

      let countStepNegotiation = 0
      const groupByStepsNegotiation = await this.leadsRepository.groupBySteps(
        ['matriculation', 'documents'],
        {
          matriculation: true,
          documents: false,
          ...where,
        },
      )
      groupByStepsNegotiation.forEach((item) => {
        countStepNegotiation = countStepNegotiation + item._count.id
      })

      let countStepClosing = 0
      const groupByStepsClosing = await this.leadsRepository.groupBySteps(
        ['matriculation', 'documents'],
        {
          matriculation: true,
          documents: true,
          ...where,
        },
      )
      groupByStepsClosing.forEach((item) => {
        countStepClosing = countStepClosing + item._count.id
      })

      return {
        countStepNewLeads,
        countStepPreService,
        countStepPresentationOportunity: countStepPresentationOpportunity,
        countStepNegotiation,
        countStepClosing,
      }
    }

    const handleBonus = async () => {
      let bonus_awaiting_confirmation = {
        total: 0,
        indicator: 0,
        consultant: 0,
      }
      let bonus_confirmed = {
        total: 0,
        indicator: 0,
        consultant: 0,
      }

      const profiles_to_receive_consultant =
        await this.userRepository.mountSelectConsultant({
          profile: {
            amountToReceive: {
              not: null,
            },
            role: 'consultant',
          },
        })
      const profiles_to_receive_indicator =
        await this.userRepository.mountSelectIndicator({
          profile: {
            amountToReceive: {
              not: null,
            },
            role: 'indicator',
          },
        })

      let total_to_receive_consultant = 0
      profiles_to_receive_consultant.forEach((user_consultant) => {
        total_to_receive_consultant =
          total_to_receive_consultant +
          (user_consultant?.profile?.amountToReceive ?? 0)
      })
      let total_to_receive_indicator = 0
      profiles_to_receive_indicator.forEach((user_indicator) => {
        total_to_receive_indicator =
          total_to_receive_indicator +
          (user_indicator?.profile?.amountToReceive ?? 0)
      })
      bonus_awaiting_confirmation = {
        total: total_to_receive_consultant + total_to_receive_indicator,
        indicator: total_to_receive_indicator,
        consultant: total_to_receive_consultant,
      }

      const addAmountReceiveIndicator =
        await this.extractProfileRepository.addAmountReceive({
          profile: {
            role: 'indicator',
          },
        })
      const addAmountReceiveConsultant =
        await this.extractProfileRepository.addAmountReceive({
          profile: {
            role: 'consultant',
          },
        })

      bonus_confirmed = {
        total:
          (addAmountReceiveIndicator._sum.amount_receive ?? 0) +
          (addAmountReceiveConsultant._sum.amount_receive ?? 0),
        indicator: addAmountReceiveIndicator._sum.amount_receive ?? 0,
        consultant: addAmountReceiveConsultant._sum.amount_receive ?? 0,
      }

      return { bonus_awaiting_confirmation, bonus_confirmed }
    }

    const handleRankingIndicators = async () => {
      const leadsRankingIndicator = await this.profilesRepository.findMany(
        {
          leadsIndicator: {
            some: {},
          },
        },
        {
          leadsIndicator: {
            _count: 'desc',
          },
        },
      )
      const leadsRankingConsultant = await this.profilesRepository.findMany(
        {
          leadsConsultant: {
            some: {},
          },
        },
        {
          leadsConsultant: {
            _count: 'desc',
          },
        },
      )
      const rankingIndicator: ListRanking[] = leadsRankingIndicator.map(
        (profile_indicator) => {
          return {
            name: profile_indicator.user.name,
            quant: profile_indicator.leadsIndicator.length,
          }
        },
      )

      const rankingConsultant: ListRanking[] = leadsRankingConsultant.map(
        (profile_indicator) => {
          return {
            name: profile_indicator.user.name,
            quant: profile_indicator.leadsConsultant.length,
          }
        },
      )

      return {
        leadsRankingIndicator: rankingIndicator,
        leadsRankingConsultant: rankingConsultant,
      }
    }

    const handleRankingCourses = async () => {
      const coursesRanking = await this.courseRepository.mountSelect(
        {},
        {
          leads: {
            _count: 'desc',
          },
        },
        {
          leads: {
            where: {
              documents: true,
            },
            select: {
              id: true,
              name: true,
            },
          },
        },
      )
      const leadsCoursesRanking: ListRanking[] = coursesRanking.map(
        (course) => {
          return {
            name: course.name,
            quant: course.leads.length,
          }
        },
      )
      console.log('leadsCoursesRanking: ', leadsCoursesRanking)
      return { coursesRanking: leadsCoursesRanking }
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

      const {
        countStepClosing,
        countStepNegotiation,
        countStepNewLeads,
        countStepPreService,
        countStepPresentationOportunity,
      } = await handleLeadsSteps()

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
        leads_by_steps: {
          countStepClosing,
          countStepNegotiation,
          countStepNewLeads,
          countStepPreService,
          countStepPresentationOportunity,
        },
      }
    }

    if (profile?.role === 'administrator' || profile?.role === 'coordinator') {
      const { average_service_time, totalLeads } =
        await handleLeadsAverageServiceTime()
      const { bonus_awaiting_confirmation, bonus_confirmed } =
        await handleBonus()
      const { leadsRankingConsultant, leadsRankingIndicator } =
        await handleRankingIndicators()
      const { coursesRanking } = await handleRankingCourses()
      graphics = {
        ...graphics,
        average_service_time: {
          ...average_service_time,
          totalLeads,
        },
        bonus: {
          bonus_awaiting_confirmation,
          bonus_confirmed,
        },
        leadsRankingConsultant,
        leadsRankingIndicator,
        coursesRanking,
      }
    }

    if (!graphics) throw new CourseNotFoundError()

    return { graphics }
  }
}
