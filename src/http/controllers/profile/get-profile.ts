import { getProfileFromUserIdService } from '@/services/@factories/profile/get-profile-from-userId-service'
import { makeListUnitOpeningHoursService } from '@/services/@factories/unit/make-list-unit-opening-hours-service'

import { RoleName, UnitOpeningHour } from '@prisma/client'
import { FastifyReply, FastifyRequest } from 'fastify'

export const GetProfile = async (
  request: FastifyRequest,
  replay: FastifyReply,
) => {
  const getProfileFromUserId = getProfileFromUserIdService()
  const userId = request.user.sub
  const { profile } = await getProfileFromUserId.execute({ id: userId })

  const roles = Object.values(RoleName) as readonly RoleName[]
  let openingHours: UnitOpeningHour[] = []
  if (profile?.user.unit?.id) {
    const listOpeningHours = makeListUnitOpeningHoursService()
    const res = await listOpeningHours.execute({ unitId: profile.user.unit.id })
    openingHours = res.openingHours
  }

  return replay.status(200).send({ profile, roles, openingHours })
}
