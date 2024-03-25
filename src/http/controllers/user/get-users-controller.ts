import { getUsersService } from '@/services/factories/get-users-service'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function getUsers(request: FastifyRequest, replay: FastifyReply) {
  const getUsers = getUsersService()

  const { users } = await getUsers.execute()

  return replay.status(200).send({
    users,
  })
}
