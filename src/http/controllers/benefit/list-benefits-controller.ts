import { makeListBenefitsService } from '@/services/@factories/benefit/make-list-benefits'
import { FastifyRequest, FastifyReply } from 'fastify'
import { UserToken } from '../authenticate-controller'
import { z } from 'zod'

/// / 1 - terminar de revisar os arquivos para comitar e subir as alteracoes
/// / 2 - mergear a branch codex/add-route-to-cancel-user-plan para pegar as
/// / melhorias que se perderam nessa branch e resolver os conflitos

export const ListBenefitsController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const service = makeListBenefitsService()
  const user = request.user as UserToken
  const querySchema = z.object({
    withCount: z.coerce.boolean().optional(),
    page: z.coerce.number().int().min(1).optional(),
    perPage: z.coerce.number().int().min(1).max(100).optional(),
    name: z.string().optional(),
  })
  const params = querySchema.parse(request.query)
  const result = await service.execute(user, params)
  if (params.withCount) return reply.status(200).send(result)
  return reply.status(200).send(result.items)
}
