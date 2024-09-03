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

  const indicator = await prisma.user.upsert({
    where: { email: 'indicator@sim.com' },
    update: {},
    create: {
      name: 'indicator',
      email: 'indicator@sim.com',
      password: password_hash,
      active: true,
      profile: {
        create: {
          id: '01-profile',
          genre: 'homem',
          birthday: '01/01/1999',
          cpf: '000.123.456.78',
          phone: '96787548155',
          pix: 'indicator@sim.com',
          city: 'Santana',
          role: 'indicator',
        },
      },
    },
  })

  const consultant = await prisma.user.upsert({
    where: { email: 'consultant@sim.com' },
    update: {},
    create: {
      name: 'consultant',
      email: 'consultant@sim.com',
      password: password_hash,
      active: true,
      profile: {
        create: {
          id: '02-profile',
          genre: 'homem',
          birthday: '12/11/1999',
          cpf: '000.123.456.78',
          phone: '96787548155',
          pix: 'consultant@sim.com',
          city: 'Santana',
          role: 'consultant',
        },
      },
    },
  })

  const course = await prisma.course.upsert({
    where: { id: '' },
    update: {},
    create: {
      name: 'Enfermagem',
      active: true,
      segments: {
        create: {
          segment: {
            create: {
              name: 'Graduação',
            },
          },
        },
      },
      units: {
        create: {
          unit: {
            create: {
              name: 'Unidade de santana',
            },
          },
        },
      },
    },
  })

  const segment = await prisma.segment.upsert({
    where: { id: '' },
    update: {},
    create: {
      name: 'Tecnico',
    },
  })

  const unit = await prisma.unit.upsert({
    where: { id: '' },
    update: {},
    create: {
      name: 'Unidade Macapá',
      segments: {
        create: {
          segmentId: segment.id,
        },
      },
      courses: {
        create: {
          courseId: course.id,
        },
      },
    },
  })

  const lead = await prisma.leads.upsert({
    where: { id: '' },
    update: {},
    create: {
      name: 'Matheus Mendes',
      phone: '96984235689',
      document: '00211556896',
      email: 'matheusmendess.c@gmail.com',
      city: 'Macapá',
      indicatorId: '01-profile',
      consultantId: '02-profile',
      courseId: course.id,
      segmentId: segment.id,
      unitId: unit.id,
      archived: false,
    },
  })

  console.log({
    madretereza,
    madreAdmin,
    course,
    lead,
    consultant,
    indicator,
    unit,
    segment,
  })
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
