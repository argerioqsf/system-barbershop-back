import { UnitRepository } from "@/repositories/unit-repository";
import { Unit } from "@prisma/client";

interface CreateUnitServiceRequest {
  name: string
}

interface CreateUnitServiceResponse {
  unit: Unit
}

export class CreateUnitService {
  constructor(private unitRepository: UnitRepository) {}

  async execute({ name }: CreateUnitServiceRequest): Promise<CreateUnitServiceResponse> {
    const unit = await this.unitRepository.create({
      name,
    });

    return { unit };
  }
}
