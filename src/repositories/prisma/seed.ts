import { env } from '@/env'
import {
  PrismaClient,
  Role,
  PaymentMethod,
  PaymentStatus,
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
      slug: 'lobo-barbershop',
    },
  })

  const organization2 = await prisma.organization.create({
    data: {
      name: 'Argerio BarberShop',
      slug: 'argerio-barbershop',
    },
  })

  const mainUnit = await prisma.unit.create({
    data: {
      name: 'Main Unit',
      slug: 'main-unit',
      organization: { connect: { id: organization.id } },
    },
  })

  const Unit2 = await prisma.unit.create({
    data: {
      name: 'Unit 2',
      slug: 'unit-2',
      organization: { connect: { id: organization2.id } },
    },
  })

  const owner = await prisma.user.create({
    data: {
      name: 'Owner',
      email: 'owner@barbershop.com',
      password: passwordHash,
      active: true,
      organization: { connect: { id: organization.id } },
      profile: {
        create: {
          phone: '969855555',
          cpf: '33344455566',
          genre: 'M',
          birthday: '1980-04-15',
          pix: 'ownerpix',
          role: Role.OWNER,
          totalBalance: 0,
        },
      },
      unit: { connect: { id: mainUnit.id } },
    },
  })

  const owner2 = await prisma.user.create({
    data: {
      name: 'Owner',
      email: 'owner2@barbershop.com',
      password: passwordHash,
      active: true,
      organization: { connect: { id: organization2.id } },
      profile: {
        create: {
          phone: '969855555',
          cpf: '33344455566',
          genre: 'M',
          birthday: '1980-04-15',
          pix: 'ownerpix',
          role: Role.OWNER,
          totalBalance: 0,
        },
      },
      unit: { connect: { id: Unit2.id } },
    },
  })

  await prisma.organization.update({
    where: { id: organization.id },
    data: { owner: { connect: { id: owner.id } } },
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
          totalBalance: 0,
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
          commissionPercentage: 70,
          role: Role.BARBER,
          totalBalance: 0,
        },
      },
      unit: { connect: { id: mainUnit.id } },
    },
  })

  const client = await prisma.user.create({
    data: {
      name: 'Client',
      email: 'argerioaf@gmail.com',
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
          totalBalance: 0,
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

  const shampoo = await prisma.product.create({
    data: {
      name: 'Shampoo',
      description: 'Hair shampoo',
      cost: 5,
      price: 15,
      quantity: 10,
      unit: { connect: { id: mainUnit.id } },
    },
  })

  const itemCoupon = await prisma.coupon.create({
    data: {
      code: 'ITEM5',
      description: 'R$5 off item',
      discount: 5,
      discountType: DiscountType.VALUE,
      quantity: 10,
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

  const cashSession = await prisma.cashRegisterSession.create({
    data: {
      openedById: admin.id,
      unitId: mainUnit.id,
      initialAmount: 100,
    },
  })

  await prisma.transaction.create({
    data: {
      userId: admin.id,
      unitId: mainUnit.id,
      cashRegisterSessionId: cashSession.id,
      type: TransactionType.ADDITION,
      description: 'Initial cash',
      amount: 100,
    },
  })
  await prisma.unit.update({
    where: { id: mainUnit.id },
    data: { totalBalance: { increment: 100 } },
  })
  await prisma.organization.update({
    where: { id: organization.id },
    data: { totalBalance: { increment: 100 } },
  })

  const transaction = await prisma.transaction.create({
    data: {
      userId: client.id,
      unitId: mainUnit.id,
      cashRegisterSessionId: cashSession.id,
      type: TransactionType.ADDITION,
      description: 'Sale',
      amount: 35,
    },
  })
  await prisma.unit.update({
    where: { id: mainUnit.id },
    data: { totalBalance: { increment: 35 } },
  })
  await prisma.organization.update({
    where: { id: organization.id },
    data: { totalBalance: { increment: 35 } },
  })

  const sale = await prisma.sale.create({
    data: {
      user: { connect: { id: admin.id } },
      client: { connect: { id: client.id } },
      unit: { connect: { id: mainUnit.id } },
      session: { connect: { id: cashSession.id } },
      total: 35,
      method: PaymentMethod.CASH,
      paymentStatus: PaymentStatus.PAID,
      items: {
        create: [
          {
            serviceId: haircut.id,
            quantity: 1,
            barberId: barber.id,
            price: 25,
            discount: 5,
            discountType: DiscountType.VALUE,
            porcentagemBarbeiro: 70,
          },
          {
            productId: shampoo.id,
            quantity: 1,
            couponId: itemCoupon.id,
            price: 10,
            discount: 5,
            discountType: DiscountType.VALUE,
          },
        ],
      },
      transaction: { connect: { id: transaction.id } },
    },
  })
  const pendingSale = await prisma.sale.create({
    data: {
      user: { connect: { id: admin.id } },
      client: { connect: { id: client.id } },
      unit: { connect: { id: mainUnit.id } },
      total: 20,
      method: PaymentMethod.CASH,
      paymentStatus: PaymentStatus.PENDING,
      items: {
        create: [
          {
            serviceId: haircut.id,
            quantity: 1,
            barberId: barber.id,
            price: 20,
            porcentagemBarbeiro: 70,
          },
        ],
      },
    },
  })
  await prisma.product.update({
    where: { id: shampoo.id },
    data: { quantity: { decrement: 1 } },
  })
  const shareBarber = (25 * 70) / 100
  const shareOwner = 25 - shareBarber
  await prisma.profile.update({
    where: { userId: barber.id },
    data: { totalBalance: { increment: shareBarber } },
  })
  await prisma.profile.update({
    where: { userId: owner.id },
    data: { totalBalance: { increment: shareOwner } },
  })
  await prisma.unit.update({
    where: { id: mainUnit.id },
    data: { totalBalance: { increment: 35 } },
  })
  await prisma.organization.update({
    where: { id: organization.id },
    data: { totalBalance: { increment: 35 } },
  })

  await prisma.coupon.create({
    data: {
      code: 'WELCOME10',
      description: '10% off',
      discount: 10,
      discountType: DiscountType.PERCENTAGE,
      quantity: 10,
      unit: { connect: { id: mainUnit.id } },
    },
  })

  console.log({
    organization,
    organization2,
    mainUnit,
    Unit2,
    admin,
    barber,
    client,
    haircut,
    shampoo,
    appointment,
    cashSession,
    sale,
    pendingSale,
    itemCoupon,
    owner2,
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
