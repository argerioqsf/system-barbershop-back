import { InMemoryAppointmentRepository as BaseInMemoryAppointmentRepository } from '@/repositories/in-memory/in-memory-appointment-repository'

/**
 * Adapter in-memory para testes enquanto o módulo Scheduling é migrado.
 */
export class InMemoryAppointmentRepository extends BaseInMemoryAppointmentRepository {}
