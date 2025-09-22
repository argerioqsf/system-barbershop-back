import { GetItemsBuildRequest, GetItemsBuildResponse } from './types'
import { ProductToUpdate, ReturnBuildItemData } from './utils/item'
import { GetItemBuildService } from './get-item-build'

export class GetItemsBuildService {
  constructor(private readonly getItemBuildService: GetItemBuildService) {}

  async execute({
    saleItems,
    unitId,
  }: GetItemsBuildRequest): Promise<GetItemsBuildResponse> {
    const saleItemsBuild: ReturnBuildItemData[] = []
    const newAppointmentsToLink: string[] = []
    const productsToUpdate: ProductToUpdate[] = []
    for (const saleItem of saleItems) {
      const { productsToUpdate: itemProductsToUpdate, saleItemBuild } =
        await this.getItemBuildService.execute({
          saleItem,
          unitId,
        })
      saleItemsBuild.push(saleItemBuild)
      productsToUpdate.push(...itemProductsToUpdate)
      if (saleItem.appointmentId)
        newAppointmentsToLink.push(saleItem.appointmentId)
    }
    return { saleItemsBuild, newAppointmentsToLink, productsToUpdate }
  }
}
