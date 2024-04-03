import { getUsersService } from '@/services/@factories/user/get-users-service'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function List(request: FastifyRequest, replay: FastifyReply) {
  const getUsers = getUsersService()

  const { users } = await getUsers.execute()

  return replay.status(200).send({
    users,
  })
}
