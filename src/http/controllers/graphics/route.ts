import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { FastifyInstance } from 'fastify'
import { getGraphics } from './get-graphics'

export async function graphicsRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)

  app.get('/graphics', getGraphics)
}
