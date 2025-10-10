import { UsersRepository } from '@/repositories/users-repository'
import { UnitRepository } from '@/repositories/unit-repository'
import { UnitNotFoundError } from '../@errors/unit/unit-not-found-error'
import { UserNotFoundError } from '../@errors/user/user-not-found-error'
import { UserToken } from '@/http/controllers/authenticate-controller'
import { FastifyReply, FastifyRequest } from 'fastify'

export class UnitNotFromOrganizationError extends Error {
  constructor() {
    super('Unit does not belong to your organization')
  }
}

interface SetUserUnitRequest {
  user: UserToken
  unitId: string
}

export class SetUserUnitService {
  constructor(
    private usersRepository: UsersRepository,
    private unitRepository: UnitRepository,
  ) {}

  async execute(
    { user, unitId }: SetUserUnitRequest,
    reply?: FastifyReply,
    request?: FastifyRequest,
  ): Promise<void> {
    if (!user) throw new UserNotFoundError()
    const changeUnit = unitId !== user.unitId

    const isAdmin = user.role === 'ADMIN'
    const unit = await this.unitRepository.findById(unitId)
    if (!unit) throw new UnitNotFoundError()

    const changeOrganization = unit.organizationId !== user.organizationId

    if (!isAdmin && changeOrganization) {
      throw new UnitNotFromOrganizationError()
    }

    const userUpdated = await this.usersRepository.update(user.sub, {
      unit: { connect: { id: unitId } },
      ...(changeOrganization && {
        organization: { connect: { id: unit.organizationId } },
      }),
      ...(changeUnit && { versionToken: { increment: 1 } }),
      ...(changeUnit && {
        versionTokenInvalidate: user.versionToken,
      }),
    })

    if (changeUnit && reply && request) {
      const permissions = userUpdated?.profile?.permissions.map(
        (permission) => permission.name,
      )
      const newToken = await reply.jwtSign(
        {
          unitId,
          organizationId: userUpdated.organizationId,
          role: userUpdated.profile?.role.name,
          permissions,
          versionToken: userUpdated.versionToken,
        },
        { sign: { sub: user.sub } },
      )
      request.newToken = newToken
    }
  }
}
