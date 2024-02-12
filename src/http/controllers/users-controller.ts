import { PrismaUsersRepository } from '@/repositories/prisma/prisma-users-repository'
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
    return replay.status(409).send()
  }

  return replay.status(201).send()
}
