import { getProfileFromUserIdService } from '@/services/@factories/profile/get-profile-from-userId-service'

import type { Role } from '@/@types/roles'
import { FastifyReply, FastifyRequest } from 'fastify'

export const GetProfile = async (
  request: FastifyRequest,
  replay: FastifyReply,
) => {
  const getProfileFromUserId = getProfileFromUserIdService()
  const userId = request.user.sub
  const { profile } = await getProfileFromUserId.execute({ id: userId })

  const Roles: readonly Role[] = ['ADMIN','BARBER','CLIENT','ATTENDANT','MANAGER','OWNER']
  return replay.status(200).send({
    profile,
    roles: Roles,
  })
}
