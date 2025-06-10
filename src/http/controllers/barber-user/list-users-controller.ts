import { makeListUsersService } from '@/services/@factories/barber-user/make-list-users'
import { makeBarberBalance } from '@/services/@factories/report/make-barber-balance'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function ListBarberUsersController(_: FastifyRequest, reply: FastifyReply) {
  const service = makeListUsersService()
  const { users } = await service.execute()
  const balanceService = makeBarberBalance()
  const usersWithBalance = await Promise.all(
    users.map(async (user) => {
      const { balance } = await balanceService.execute({ barberId: user.id })
      return { ...user, balance }
    }),
  )

  return reply.status(200).send(usersWithBalance)
}
