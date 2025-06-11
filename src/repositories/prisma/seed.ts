import { env } from '@/env'
import {
  PrismaClient,
  Role,
  PaymentMethod,
  TransactionType,
  DiscountType,
} from '@prisma/client'
import { hash } from 'bcryptjs'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {

  const passwordHash = await hash(env.PASSWORD_SEED, 6)

  const organization = await prisma.organization.create({
    data: {
      name: 'Lobo BarberShop',
    },
  })

  const mainUnit = await prisma.unit.create({
    data: {
      name: 'Main Unit',
      organization: { connect: { id: organization.id } },
    },
  })

  const admin = await prisma.user.create({
    data: {
      name: 'Admin',
      email: 'admin@barbershop.com',
      password: passwordHash,
      active: true,
      organization: { connect: { id: organization.id } },
      profile: {
        create: {
          phone: '969999999',
          cpf: '00011122233',
          genre: 'M',
          birthday: '2000-01-01',
          pix: 'adminpix',
          role: Role.ADMIN,
        },
      },
      unit: { connect: { id: mainUnit.id } },
    },
  })

  const barber = await prisma.user.create({
    data: {
      name: 'Barber',
      email: 'barber@barbershop.com',
      password: passwordHash,
      active: true,
      organization: { connect: { id: organization.id } },
      profile: {
        create: {
          phone: '969888888',
          cpf: '11122233344',
          genre: 'M',
          birthday: '1995-05-10',
          pix: 'barberpix',
          role: Role.BARBER,
        },
      },
      unit: { connect: { id: mainUnit.id } },
    },
  })

  const client = await prisma.user.create({
    data: {
      name: 'Client',
      email: 'client@barbershop.com',
      password: passwordHash,
      active: true,
      organization: { connect: { id: organization.id } },
      profile: {
        create: {
          phone: '969777777',
          cpf: '22233344455',
          genre: 'F',
          birthday: '2001-07-20',
          pix: 'clientpix',
          role: Role.CLIENT,
        },
      },
      unit: { connect: { id: mainUnit.id } },
    },
  })

  const haircut = await prisma.service.create({
    data: {
      name: 'Haircut',
      description: 'Basic haircut',
      cost: 10,
      price: 30,
      unit: { connect: { id: mainUnit.id } },
    },
  })

  const shampoo = await prisma.service.create({
    data: {
      name: 'Shampoo',
      description: 'Hair shampoo',
      cost: 5,
      price: 15,
      isProduct: true,
      unit: { connect: { id: mainUnit.id } },
    },
  })

  const appointment = await prisma.appointment.create({
    data: {
      clientId: client.id,
      barberId: barber.id,
      serviceId: haircut.id,
      unitId: mainUnit.id,
      date: new Date(),
      hour: '10:00',
    },
  })

  const sale = await prisma.sale.create({
    data: {
      userId: client.id,
      unitId: mainUnit.id,
      total: 45,
      method: PaymentMethod.CASH,
      items: {
        create: [
          { serviceId: haircut.id, quantity: 1 },
          { serviceId: shampoo.id, quantity: 1 },
        ],
      },
    },
  })

  await prisma.transaction.create({
    data: {
      userId: admin.id,
      unitId: mainUnit.id,
      type: TransactionType.ADDITION,
      description: 'Initial cash',
      amount: 100,
    },
  })

  await prisma.cashRegisterSession.create({
    data: {
      openedById: admin.id,
      unitId: mainUnit.id,
      initialAmount: 100,
    },
  })

  await prisma.coupon.create({
    data: {
      code: 'WELCOME10',
      description: '10% off',
      discount: 10,
      discountType: DiscountType.PERCENTAGE,
    },
  })

  console.log({
    organization,
    mainUnit,
    admin,
    barber,
    client,
    haircut,
    shampoo,
    appointment,
    sale,
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
