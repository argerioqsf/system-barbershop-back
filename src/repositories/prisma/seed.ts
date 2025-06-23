import { env } from '@/env'
import {
  PrismaClient,
  PaymentMethod,
  PaymentStatus,
  TransactionType,
  DiscountType,
  RoleName,
  PermissionName,
  PermissionCategory,
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

  const permissionData = [
    { name: PermissionName.LIST_USER_ALL, category: PermissionCategory.USER },
    { name: PermissionName.LIST_USER_UNIT, category: PermissionCategory.USER },
    { name: PermissionName.LIST_USER_ORG, category: PermissionCategory.USER },
    {
      name: PermissionName.UPDATE_USER_ADMIN,
      category: PermissionCategory.USER,
    },
    {
      name: PermissionName.UPDATE_USER_OWNER,
      category: PermissionCategory.USER,
    },
    {
      name: PermissionName.UPDATE_USER_BARBER,
      category: PermissionCategory.USER,
    },
    {
      name: PermissionName.MANAGE_OTHER_USER_TRANSACTION,
      category: PermissionCategory.TRANSACTION,
    },
    {
      name: PermissionName.LIST_PERMISSIONS_ALL,
      category: PermissionCategory.PERMISSIONS,
    },
    { name: PermissionName.LIST_ROLES_UNIT, category: PermissionCategory.ROLE },
    { name: PermissionName.LIST_SALES_UNIT, category: PermissionCategory.SALE },
    {
      name: PermissionName.LIST_APPOINTMENTS_UNIT,
      category: PermissionCategory.SERVICE,
    },
    {
      name: PermissionName.LIST_SERVICES_UNIT,
      category: PermissionCategory.SERVICE,
    },
    { name: PermissionName.SELL_PRODUCT, category: PermissionCategory.PRODUCT },
    { name: PermissionName.SELL_SERVICE, category: PermissionCategory.SERVICE },
    {
      name: PermissionName.MANAGE_USER_TRANSACTION_ADD,
      category: PermissionCategory.TRANSACTION,
    },
    {
      name: PermissionName.MANAGE_USER_TRANSACTION_WITHDRAWAL,
      category: PermissionCategory.TRANSACTION,
    },
    { name: PermissionName.LIST_UNIT_ALL, category: PermissionCategory.UNIT },
    { name: PermissionName.LIST_UNIT_ORG, category: PermissionCategory.UNIT },
    { name: PermissionName.LIST_ROLES_ALL, category: PermissionCategory.ROLE },
  ]

  const permissions: Record<PermissionName, { id: string }> = {} as Record<
    PermissionName,
    { id: string }
  >

  for (const data of permissionData) {
    const permission = await prisma.permission.create({ data })
    permissions[data.name] = permission
  }

  const Unit2 = await prisma.unit.create({
    data: {
      name: 'Unit 2',
      slug: 'unit-2',
      organization: { connect: { id: organization2.id } },
    },
  })

  const roleOwner = await prisma.role.create({
    data: {
      name: RoleName.OWNER,
      unit: { connect: { id: mainUnit.id } },
    },
  })

  const roleMenager = await prisma.role.create({
    data: {
      name: RoleName.MANAGER,
      unit: { connect: { id: mainUnit.id } },
    },
  })

  const roleAdmin = await prisma.role.create({
    data: {
      name: RoleName.ADMIN,
      unit: { connect: { id: mainUnit.id } },
      permissions: {
        connect: Object.values(permissions).map((p) => ({ id: p.id })),
      },
    },
  })

  const roleBarber = await prisma.role.create({
    data: {
      name: RoleName.BARBER,
      unit: { connect: { id: mainUnit.id } },
    },
  })

  const roleClient = await prisma.role.create({
    data: {
      name: RoleName.CLIENT,
      unit: { connect: { id: mainUnit.id } },
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
          totalBalance: 0,
          role: { connect: { id: roleAdmin.id } },
          permissions: {
            connect: [{ id: permissions[PermissionName.LIST_USER_ORG].id }],
          },
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
          totalBalance: 0,
          role: { connect: { id: roleOwner.id } },
        },
      },
      unit: { connect: { id: Unit2.id } },
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
          totalBalance: 0,
          role: { connect: { id: roleAdmin.id } },
          permissions: {
            connect: Object.values(permissions).map((p) => ({ id: p.id })),
          },
        },
      },
      unit: { connect: { id: mainUnit.id } },
    },
  })

  const manager = await prisma.user.create({
    data: {
      name: 'Manager',
      email: 'manager@barbershop.com',
      password: passwordHash,
      active: true,
      organization: { connect: { id: organization.id } },
      profile: {
        create: {
          phone: '969222222',
          cpf: '55566677788',
          genre: 'M',
          birthday: '1990-03-10',
          pix: 'managerpix',
          totalBalance: 0,
          role: { connect: { id: roleMenager.id } },
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
          totalBalance: 0,
          role: { connect: { id: roleBarber.id } },
          permissions: {
            connect: [
              { id: permissions[PermissionName.SELL_SERVICE].id },
              { id: permissions[PermissionName.SELL_PRODUCT].id },
            ],
          },
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
          totalBalance: 0,
          role: { connect: { id: roleClient.id } },
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
      receiptUrl: '/uploads/sample-receipt.png',
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
    manager,
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
