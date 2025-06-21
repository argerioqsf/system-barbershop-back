import { FastifyReply, FastifyRequest } from 'fastify'
import { PrismaUsersRepository } from '@/repositories/prisma/prisma-users-repository'
import { UserToken } from '../controllers/authenticate-controller'

export async function verifyJWT(request: FastifyRequest, replay: FastifyReply) {
  try {
    await request.jwtVerify()
    const token = request.user as UserToken
    const repo = new PrismaUsersRepository()
    const user = await repo.findById(token.sub)
    if (!user) {
      return replay.status(401).send({ message: 'Unauthorized' })
    }
    if (
      user.versionTokenInvalidate &&
      user.versionTokenInvalidate === token.versionToken
    ) {
      return replay.status(401).send({ message: 'Unauthorized' })
    }
    if (token.versionToken && token.versionToken < user.versionToken) {
      return replay.status(401).send({ message: 'Unauthorized' })
    }
  } catch (error) {
    return replay.status(401).send({ message: 'Unauthorized' })
  }
}
