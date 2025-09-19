import { GetItemsBuildRequest, GetItemsBuildResponse } from './types'
import { ProductToUpdate, ReturnBuildItemData } from './utils/item'
import { makeGetItemBuildService } from '../@factories/sale/make-get-item-build'

export class GetItemsBuildService {
  async execute({
    saleItems,
    unitId,
  }: GetItemsBuildRequest): Promise<GetItemsBuildResponse> {
    const saleItemsBuild: ReturnBuildItemData[] = []
    const newAppointmentsToLink: string[] = []
    const productsToUpdate: ProductToUpdate[] = []
    const getItemsBuild = makeGetItemBuildService()
    for (const saleItem of saleItems) {
      const { productsToUpdate, saleItemBuild } = await getItemsBuild.execute({
        saleItem,
        unitId,
      })
      saleItemsBuild.push(saleItemBuild)
      productsToUpdate.push(...productsToUpdate)
      if (saleItem.appointmentId)
        newAppointmentsToLink.push(saleItem.appointmentId)
    }
    return { saleItemsBuild, newAppointmentsToLink, productsToUpdate }
  }
}
