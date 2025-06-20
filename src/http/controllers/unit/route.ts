import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { FastifyInstance } from 'fastify'
import { CreateUnitController } from './create-unit-controller'
import { ListUnitsController } from './list-units-controller'
import { GetUnitController } from './get-unit-controller'
import { UpdateUnitController } from './update-unit-controller'
import { DeleteUnitController } from './delete-unit-controller'

export async function unitRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)

  app.post('/units', CreateUnitController)
  app.get('/units', ListUnitsController)
  app.get('/units/:id', GetUnitController)
  app.put('/units/:id', UpdateUnitController)
  app.delete('/units/:id', DeleteUnitController)
}
