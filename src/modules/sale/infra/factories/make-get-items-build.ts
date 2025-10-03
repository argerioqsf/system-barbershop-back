import { makeGetItemBuildService } from '@/modules/sale/infra/factories/make-get-item-build'
import { GetItemsBuildService } from '@/services/sale/get-items-build'

export function makeGetItemsBuildService() {
  const getItemBuildService = makeGetItemBuildService()
  return new GetItemsBuildService(getItemBuildService)
}
