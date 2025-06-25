import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { FastifyInstance } from 'fastify'
import { AddUnitOpeningHourController } from './add-unit-opening-hour-controller'
import { DeleteUnitOpeningHourController } from './delete-unit-opening-hour-controller'
import { ListUnitOpeningHourController } from './list-unit-opening-hour-controller'

export async function unitOpeningHourRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)

  app.post('/units/:unitId/opening-hours', AddUnitOpeningHourController)
  app.delete(
    '/units/:unitId/opening-hours/:id',
    DeleteUnitOpeningHourController,
  )
  app.get('/units/opening-hours', ListUnitOpeningHourController)
}
