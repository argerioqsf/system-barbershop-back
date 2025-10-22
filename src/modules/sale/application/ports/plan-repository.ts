// MIGRATION-TODO: substituir pelo repositório do módulo Plans & Recurrence quando disponível.
import type {
  PlanRepository as BasePlanRepository,
  PlanWithBenefits,
  PlanWithBenefitsAndRecurrence,
  PlanWithRecurrence,
} from '@/repositories/plan-repository'

export type PlanRepository = BasePlanRepository

export type {
  PlanWithBenefits,
  PlanWithBenefitsAndRecurrence,
  PlanWithRecurrence,
}
