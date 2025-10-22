// MIGRATION-TODO: substituir pelo repositório do módulo Plans & Recurrence quando migrado.
import type {
  PlanProfileRepository as BasePlanProfileRepository,
  PlanProfileWithDebts,
  PlanProfileWithPlan,
  PlanProfileFindById,
} from '@/repositories/plan-profile-repository'

export type PlanProfileRepository = BasePlanProfileRepository

export type { PlanProfileWithDebts, PlanProfileWithPlan, PlanProfileFindById }
