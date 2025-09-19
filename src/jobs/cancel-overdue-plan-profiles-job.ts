import { makeCancelOverduePlanProfiles } from '@/services/@factories/plan/make-cancel-overdue-plan-profiles'

export function startCancelOverduePlanProfilesJob() {
  const service = makeCancelOverduePlanProfiles()

  async function run() {
    try {
      await service.execute()
    } catch (err) {
      console.error('Failed to cancel overdue plan profiles', err)
    }
  }

  run()
  const dayMs = 1000 * 60 * 60 * 24
  setInterval(run, dayMs)
}
