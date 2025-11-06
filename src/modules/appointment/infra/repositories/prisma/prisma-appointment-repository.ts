import { PrismaAppointmentRepository as BasePrismaAppointmentRepository } from '@/repositories/prisma/prisma-appointment-repository'

/**
 * Adapter de compatibilidade enquanto o módulo Scheduling não estiver migrado.
 * Implementa a port de appointments reutilizando o repositório legado.
 */
export class PrismaAppointmentRepository extends BasePrismaAppointmentRepository {}
