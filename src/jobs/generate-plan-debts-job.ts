import { makeGeneratePlanDebts } from '@/services/@factories/plan/make-generate-plan-debts'

export function startGeneratePlanDebtsJob() {
  const service = makeGeneratePlanDebts()

  async function run() {
    try {
      await service.execute()
    } catch (err) {
      console.error('Failed to generate plan debts', err)
    }
  }

  run()
  const dayMs = 1000 * 60 * 60 * 24
  setInterval(run, dayMs)
}
