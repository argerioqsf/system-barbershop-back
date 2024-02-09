import { prisma } from '@/lib/prisma'
import { PrismaUsersRepository } from '@/repositories/prisma-users-repository'
// import { hash } from 'bcryptjs'

interface usersCasesRequest {
  firstName: string
  lastName: string
  phone: string
  cpf: string
  dateOfBirth: string
  gender: string
  role: string
  status: string
  password: string
  email: string
}

export async function usersRegister({
  firstName,
  lastName,
  phone,
  cpf,
  dateOfBirth,
  gender,
  role,
  status,
  password,
  email,
}: usersCasesRequest) {
  // const password_hash = await hash(password, 6)

  const userWithSameEmail = await prisma.user.findUnique({
    where: {
      email,
    },
  })

  if (userWithSameEmail) {
    throw new Error('email ja em uso')
  }

  const prismaUsersRepository = new PrismaUsersRepository()

  await prismaUsersRepository.create({
    firstName,
    lastName,
    phone,
    cpf,
    dateOfBirth,
    gender,
    role,
    status,
    password,
    email,
  })
}
