import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { FastifyInstance } from 'fastify'
import { AddWorkHourController } from './add-work-hour-controller'
import { AddBlockedHourController } from './add-blocked-hour-controller'

export async function profileHoursRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)

  app.post('/profile/:profileId/work-hours', AddWorkHourController)
  app.post('/profile/:profileId/blocked-hours', AddBlockedHourController)
}
