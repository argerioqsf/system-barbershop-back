import { LeadsRepository } from '@/repositories/leads-repository'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import { Leads } from '@prisma/client'
import { LeadsNotFoundError } from '../@errors/leads-not-found-error'
import { UserNotFoundError } from '../@errors/user-not-found-error'
import { UserTypeNotCompatible } from '../@errors/user-type-not-compatible'
import { LeadAlreadyHasConsultant } from '../@errors/lead-already-has-consultant'

interface UpdateAddLeadConsultantServiceRequest {
  id: string
  userId: string
}

interface UpdateAddLeadConsultantServiceResponse {
  lead: Leads
}

export class UpdateAddConsultantLeadService {
  constructor(
    private leadRepository: LeadsRepository,
    private profileRepository: ProfilesRepository,
  ) {}

  async execute({
    id,
    userId,
  }: UpdateAddLeadConsultantServiceRequest): Promise<UpdateAddLeadConsultantServiceResponse> {
    const profileConsultant = await this.profileRepository.findByUserId(userId)
    const findLeadById = await this.leadRepository.findById(id)

    if (!findLeadById) throw new LeadsNotFoundError()

    if (!profileConsultant) throw new UserNotFoundError()

    if (profileConsultant.role !== 'consultant') {
      throw new UserTypeNotCompatible()
    }

    if (findLeadById.consultantId && findLeadById.consultantId?.length > 0)
      throw new LeadAlreadyHasConsultant()

    const lead = await this.leadRepository.updateById(
      id,
      {
        id,
        consultantId: profileConsultant.id,
      },
      [
        {
          description: `O consultor ${profileConsultant.user.name} pegou o lead ${findLeadById.name}`,
          status: 'Pegou',
          courseId: findLeadById.courseId,
          segmentId: findLeadById.segmentId,
          unitId: findLeadById.unitId,
          title: '',
        },
      ],
    )

    return {
      lead,
    }
  }
}
