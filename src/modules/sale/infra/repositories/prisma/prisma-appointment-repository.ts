// MIGRATION-TODO: mover adaptador para o módulo Scheduling quando for migrado.
import { PrismaAppointmentRepository as BasePrismaAppointmentRepository } from '@/repositories/prisma/prisma-appointment-repository'

export class PrismaAppointmentRepository extends BasePrismaAppointmentRepository {}
