import { verifyJWT } from '@/http/middlewares/verify-jwt'
import { verifyPermission } from '@/http/middlewares/verify-permission'
import { FastifyInstance } from 'fastify'
import { CreateOrganizationController } from './create-organization-controller'
import { ListOrganizationsController } from './list-organizations-controller'
import { GetOrganizationController } from './get-organization-controller'
import { UpdateOrganizationController } from './update-organization-controller'
import { DeleteOrganizationController } from './delete-organization-controller'

export async function organizationRoute(app: FastifyInstance) {
  app.addHook('onRequest', verifyJWT)

  app.post('/organizations', CreateOrganizationController)
  app.get(
    '/organizations',
    { preHandler: verifyPermission('LIST_ORGANIZATIONS') },
    ListOrganizationsController,
  )
  app.get('/organizations/:id', GetOrganizationController)
  app.put('/organizations/:id', UpdateOrganizationController)
  app.delete('/organizations/:id', DeleteOrganizationController)
}
