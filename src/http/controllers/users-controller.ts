import { PrismaUsersRepository } from '@/repositories/prisma/prisma-users-repository'
import { UserAlreadyExistsError } from '@/services/errors/user-already-exists-error'
import { UserService } from '@/services/users-services'
import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'

export async function users(request: FastifyRequest, replay: FastifyReply) {
  const registerBodySchema = z.object({
    firstName: z.string(),
    lastName: z.string(),
    phone: z.string(),
    cpf: z.string(),
    dateOfBirth: z.string(),
    gender: z.string(),
    role: z.string(),
    status: z.string(),
    email: z.string().email(),
    password: z.string().min(6),
  })

  const {
    firstName,
    lastName,
    phone,
    cpf,
    dateOfBirth,
    gender,
    role,
    status,
    email,
    password,
  } = registerBodySchema.parse(request.body)

  try {
    const prismaUserRepository = new PrismaUsersRepository()
    const userService = new UserService(prismaUserRepository)

    await userService.execute({
      firstName,
      lastName,
      phone,
      cpf,
      dateOfBirth,
      gender,
      role,
      status,
      email,
      password,
    })
  } catch (error) {
    if (error instanceof UserAlreadyExistsError) {
      return replay.status(409).send({ message: error.message })
    }
    throw error
  }

  return replay.status(201).send()
}
