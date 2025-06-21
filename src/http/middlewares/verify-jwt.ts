import { FastifyReply, FastifyRequest } from 'fastify'
import { PrismaUsersRepository } from '@/repositories/prisma/prisma-users-repository'
import { RoleName } from '@prisma/client'
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
      const permissions = user.profile?.permissions.map((p) => p.name)
      const newVersion = user.versionToken
      await repo.update(user.id, {
        versionTokenInvalidate: token.versionToken,
      })
      request.user = {
        sub: user.id,
        unitId: user.unitId,
        organizationId: user.organizationId,
        role: user.profile?.role.name as RoleName,
        permissions,
        versionToken: newVersion,
      }
      const newToken = await replay.jwtSign(
        {
          unitId: user.unitId,
          organizationId: user.organizationId,
          role: user.profile?.role.name,
          permissions,
          versionToken: newVersion,
        },
        { sign: { sub: user.id } },
      )
      request.newToken = newToken
    }
  } catch (error) {
    return replay.status(401).send({ message: 'Unauthorized' })
  }
}
