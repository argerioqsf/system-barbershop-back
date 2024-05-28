import { env } from '@/env'
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'
import 'dotenv/config'

const prisma = new PrismaClient()
async function main() {
  const madretereza = await prisma.organization.upsert({
    where: { slug: 'madretereza-01' },
    update: {},
    create: {
      name: 'Madre Tereza',
      consultant_bonus: 10,
      indicator_bonus: 5,
      slug: 'madretereza-01',
    },
  })

  const password_hash = await hash(env.PASSWORD_SEED, 6)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@sim.com' },
    update: {},
    create: {
      name: 'admin',
      email: 'admin@sim.com',
      password: password_hash,
      active: true,
      profile: {
        create: {
          genre: 'homem',
          birthday: '01/01/2000',
          cpf: '000.111.222.33',
          phone: '9699997777',
          pix: '9699997777',
          city: 'Macapa',
          role: 'administrator',
        },
      },
    },
  })

  const madreAdmin = await prisma.userOrganization.create({
    data: {
      userId: admin.id,
      organizationId: madretereza.id,
    },
  })

  console.log({ madretereza, madreAdmin })
}
main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
