import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { FastifyInstance } from 'fastify'
import { AddWorkHourController } from './add-work-hour-controller'
import { AddBlockedHourController } from './add-blocked-hour-controller'
import { DeleteWorkHourController } from './delete-work-hour-controller'
import { DeleteBlockedHourController } from './delete-blocked-hour-controller'

export async function profileHoursRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)

  app.post('/profile/:profileId/work-hours', AddWorkHourController)
  app.post('/profile/:profileId/blocked-hours', AddBlockedHourController)
  app.delete('/profile/:profileId/work-hours/:id', DeleteWorkHourController)
  app.delete(
    '/profile/:profileId/blocked-hours/:id',
    DeleteBlockedHourController,
  )
}
