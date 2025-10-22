import { PlanProfileRepository } from '@/repositories/plan-profile-repository'
import { PlanRepository } from '@/repositories/plan-repository'
import { DebtRepository } from '@/repositories/debt-repository'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import { RecalculateUserSalesService } from '@/modules/sale/application/use-cases/recalculate-user-sales'
import { PaymentStatus, PlanProfileStatus, PlanProfile } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { calculateNextDueDate, getLastDebtPaid } from './utils/helpers'
import { UserNotFoundError } from '../@errors/user/user-not-found-error'

interface RenewPlanProfileRequest {
  id: string
}

interface RenewPlanProfileResponse {
  planProfile: PlanProfile
}

export class RenewPlanProfileService {
  constructor(
    private planProfileRepo: PlanProfileRepository,
    private planRepo: PlanRepository,
    private debtRepo: DebtRepository,
    private profilesRepo: ProfilesRepository,
    private recalcService: RecalculateUserSalesService,
  ) {}

  async execute({
    id,
  }: RenewPlanProfileRequest): Promise<RenewPlanProfileResponse> {
    const planProfile = await this.planProfileRepo.findById(id)
    if (!planProfile) throw new Error('Plan profile not found')

    if (planProfile.status !== PlanProfileStatus.EXPIRED) {
      throw new Error('Plan profile is not expired')
    }

    const plan = await this.planRepo.findByIdWithRecurrence(planProfile.planId)
    if (!plan) throw new Error('Plan not found')

    const profile = await this.profilesRepo.findById(planProfile.profileId)
    const userId = profile?.user.id
    if (!userId) throw new UserNotFoundError()

    const now = new Date()
    await prisma.$transaction(async (tx) => {
      // TODO: verificar se ja não existe um debito para essa data
      const lastDebtPaid = getLastDebtPaid(planProfile.debts)
      if (!lastDebtPaid) throw new Error('Plan not found')
      if (!lastDebtPaid.paymentDate) throw new Error('Payment date not found')

      await this.debtRepo.create(
        {
          // TODO: verificar se ao renovar um planao nao sreia melhor pegar o valor que foi pago na sale
          // e nao pegar o valor direto do plano, pois se ele teve algum desconto na venda do plano
          // enquanto ele for renovando ele vai smepre renovar com o desconto que teve
          // pode ser criado uma flag para a unidade se quer que o desconto na venda de planos seja recorrente
          //  ou que se seja aplicado apenas no primeiro pagamento
          value: plan.price,
          status: PaymentStatus.PAID,
          planId: plan.id,
          planProfileId: planProfile.id,
          paymentDate: now,
          dueDate: calculateNextDueDate(
            lastDebtPaid.paymentDate,
            plan.typeRecurrence,
            planProfile.dueDayDebt,
          ),
        },
        tx,
      )

      await this.planProfileRepo.update(
        planProfile.id,
        {
          status: PlanProfileStatus.PAID,
        },
        tx,
      )

      await this.recalcService.execute({ userIds: [userId] }, { tx })
    })

    const updated = await this.planProfileRepo.findById(planProfile.id)
    if (!updated) throw new Error('Plan profile not found')

    return { planProfile: updated }
  }
}
