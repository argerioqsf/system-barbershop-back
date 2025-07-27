import { makeUpdatePlanProfilesStatus } from '@/services/@factories/plan/make-update-plan-profiles-status'

export function startUpdatePlanProfileStatusJob() {
  const service = makeUpdatePlanProfilesStatus()

  async function run() {
    try {
      await service.execute()
    } catch (err) {
      console.error('Failed to update plan profile status', err)
    }
  }

  run()
  const dayMs = 1000 * 60 * 60 * 24
  setInterval(run, dayMs)
}
