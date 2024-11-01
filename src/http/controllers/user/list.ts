import { getUsersService } from '@/services/@factories/user/get-users-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

const searchBodySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  name: z.string().optional(),
  active: z
    .string()
    .transform((archived) => {
      return archived === 'true'
        ? true
        : archived === 'false'
          ? false
          : undefined
    })
    .optional(),
})

export async function List(request: FastifyRequest, replay: FastifyReply) {
  const { page, name, active } = searchBodySchema.parse(request.query)

  const getUsers = getUsersService()

  const { users, count } = await getUsers.execute({ page, name, active })

  return replay.status(200).send({
    users,
    count,
  })
}
