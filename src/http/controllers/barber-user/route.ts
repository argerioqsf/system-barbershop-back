import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { FastifyInstance } from 'fastify'
import { CreateBarberUserController } from './create-user-controller'
import { ListBarberUsersController } from './list-users-controller'
import { GetBarberUserController } from './get-user-controller'
import { DeleteBarberUserController } from './delete-user-controller'
import { UpdateBarberUserController } from './update-user-controller'

export async function barberUserRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)

  app.post('/barber/users', CreateBarberUserController)
  app.get('/barber/users', ListBarberUsersController)
  app.get('/barber/users/:id', GetBarberUserController)
  app.put('/barber/users/:id', UpdateBarberUserController)
  app.delete('/barber/users/:id', DeleteBarberUserController)
}
