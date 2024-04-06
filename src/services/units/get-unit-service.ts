import { UnitRepository } from "@/repositories/unit-repository";
import { Unit } from "@prisma/client";
import { UnitNotFoundError } from "../@errors/unit-not-found-error";

interface GetUnitServiceRequest {
  id: string;
}

interface GetUnitServiceResponse {
  unit: Unit;
}

export class GetUnitService {
  constructor(private unitRepository: UnitRepository) {}

  async execute({ id }: GetUnitServiceRequest): Promise<GetUnitServiceResponse> {
    const unit = await this.unitRepository.findById(id);

    if (!unit) throw new UnitNotFoundError();

    return { unit };
  }
}
