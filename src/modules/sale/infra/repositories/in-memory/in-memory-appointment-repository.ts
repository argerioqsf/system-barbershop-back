// MIGRATION-TODO: mover adaptador para o módulo Scheduling quando for migrado.
import { InMemoryAppointmentRepository as BaseInMemoryAppointmentRepository } from '@/repositories/in-memory/in-memory-appointment-repository'

export class InMemoryAppointmentRepository extends BaseInMemoryAppointmentRepository {}
