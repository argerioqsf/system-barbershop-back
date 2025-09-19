import { app } from './app'
import { env } from './env'
import { startUpdatePlanProfileStatusJob } from './jobs/update-plan-profile-status-job'

app.get('/health', (req, res) => {
  res.status(200).send('health')
})

// startGeneratePlanDebtsJob()
startUpdatePlanProfileStatusJob()
// startCancelOverduePlanProfilesJob()

app
  .listen({
    host: '0.0.0.0',
    port: env.PORT,
  })
  .then(() => {
    console.log('Server is runner')
  })
