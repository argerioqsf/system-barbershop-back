import { makeExportUsers } from '@/services/@factories/config/make-export-users'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function ExportUsersController(_: FastifyRequest, reply: FastifyReply) {
  const service = makeExportUsers()
  const { users } = await service.execute()
  return reply.status(200).send(users)
}
