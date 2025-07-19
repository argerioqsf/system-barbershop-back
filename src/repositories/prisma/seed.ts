import { env } from '@/env'
import {
  PrismaClient,
  TransactionType,
  DiscountType,
  PaymentMethod,
  PaymentStatus,
  PlanProfileStatus,
  RoleName,
  PermissionName,
  PermissionCategory,
  User,
  Profile,
} from '@prisma/client'
import { hash } from 'bcryptjs'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {
  const permissionData = [
    { name: PermissionName.LIST_USER_ALL, category: PermissionCategory.USER },
    { name: PermissionName.LIST_USER_UNIT, category: PermissionCategory.USER },
    { name: PermissionName.LIST_USER_ORG, category: PermissionCategory.USER },
    {
      name: PermissionName.SELL_APPOINTMENT,
      category: PermissionCategory.APPOINTMENT,
    },
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
      name: PermissionName.ACCEPT_APPOINTMENT,
      category: PermissionCategory.SERVICE,
    },
    { name: PermissionName.CREATE_SALE, category: PermissionCategory.SALE },
    {
      name: PermissionName.CREATE_USER_OWNER,
      category: PermissionCategory.USER,
    },
    {
      name: PermissionName.MENAGE_USERS_WORKING_HOURS,
      category: PermissionCategory.USER,
    },
    {
      name: PermissionName.MANAGE_SELF_BLOCKED_HOURS,
      category: PermissionCategory.USER,
    },
    {
      name: PermissionName.MENAGE_USERS_BLOCKED_HOURS,
      category: PermissionCategory.USER,
    },
    {
      name: PermissionName.CREATE_USER_MANAGER,
      category: PermissionCategory.USER,
    },
    {
      name: PermissionName.CREATE_USER_ATTENDANT,
      category: PermissionCategory.USER,
    },
    {
      name: PermissionName.CREATE_USER_BARBER,
      category: PermissionCategory.USER,
    },
    {
      name: PermissionName.CREATE_USER_CLIENT,
      category: PermissionCategory.USER,
    },
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
      slotDuration: 60,
      appointmentFutureLimitDays: 7,
      organization: { connect: { id: organization.id } },
      loanMonthlyLimit: 500,
    },
  })

  for (const data of permissionData) {
    const permission = await prisma.permission.create({ data })
    permissions[data.name] = permission
  }

  const Unit2 = await prisma.unit.create({
    data: {
      name: 'Unit 2',
      slug: 'unit-2',
      slotDuration: 30,
      appointmentFutureLimitDays: 7,
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
      permissions: {
        connect: [
          { id: permissions[PermissionName.SELL_SERVICE].id },
          { id: permissions[PermissionName.SELL_PRODUCT].id },
          { id: permissions[PermissionName.ACCEPT_APPOINTMENT].id },
        ],
      },
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
            connect: [],
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
          permissions: { connect: [] },
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
          permissions: {
            connect: [],
          },
        },
      },
      unit: { connect: { id: mainUnit.id } },
    },
  })

  const barber: User & { profile: Profile | null } = await prisma.user.create({
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
              { id: permissions[PermissionName.ACCEPT_APPOINTMENT].id },
            ],
          },
        },
      },
      unit: { connect: { id: mainUnit.id } },
    },
    include: {
      profile: true,
    },
  })

  const client: User & { profile: Profile | null } = await prisma.user.create({
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
    include: {
      profile: true,
    },
  })

  const defaultCategory = await prisma.category.create({
    data: { name: 'Default', unit: { connect: { id: mainUnit.id } } },
  })

  const haircut = await prisma.service.create({
    data: {
      name: 'Haircut',
      description: 'Basic haircut',
      cost: 10,
      price: 30,
      category: { connect: { id: defaultCategory.id } },
      unit: { connect: { id: mainUnit.id } },
      commissionPercentage: 50,
    },
  })

  const serviceBarber = await prisma.barberService.create({
    data: {
      profile: { connect: { id: barber?.profile?.id } },
      service: { connect: { id: haircut.id } },
      time: 30,
      commissionPercentage: 50,
    },
  })

  const shampoo = await prisma.product.create({
    data: {
      name: 'Shampoo',
      description: 'Hair shampoo',
      cost: 5,
      price: 15,
      quantity: 10,
      category: { connect: { id: defaultCategory.id } },
      unit: { connect: { id: mainUnit.id } },
      commissionPercentage: 50,
    },
  })

  const productBarber = await prisma.barberProduct.create({
    data: {
      profile: { connect: { id: barber?.profile?.id } },
      product: { connect: { id: shampoo.id } },
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

  await prisma.unitOpeningHour.createMany({
    data: [
      {
        unitId: mainUnit.id,
        weekDay: 1,
        startHour: '08:00',
        endHour: '12:00',
      },
      {
        unitId: mainUnit.id,
        weekDay: 1,
        startHour: '14:00',
        endHour: '18:00',
      },
    ],
  })

  if (barber.profile) {
    await prisma.profileWorkHour.createMany({
      data: [
        {
          profileId: barber.profile.id,
          weekDay: 1,
          startHour: '08:00',
          endHour: '10:00',
        },
        {
          profileId: barber.profile.id,
          weekDay: 1,
          startHour: '14:00',
          endHour: '16:30',
        },
      ],
    })
    await prisma.profileBlockedHour.create({
      data: {
        profileId: barber.profile.id,
        startHour: new Date(new Date().setHours(9, 0, 0, 0)),
        endHour: new Date(new Date().setHours(10, 0, 0, 0)),
      },
    })
  }

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

  const recurrence = await prisma.typeRecurrence.create({ data: { period: 1 } })

  const benefit = await prisma.benefit.create({
    data: {
      name: 'Welcome Discount',
      description: '10% off services',
      discount: 10,
      discountType: DiscountType.PERCENTAGE,
      services: { create: [{ service: { connect: { id: haircut.id } } }] },
    },
  })

  const plan = await prisma.plan.create({
    data: {
      name: 'Monthly Plan',
      price: 80,
      typeRecurrence: { connect: { id: recurrence.id } },
      benefits: { create: [{ benefit: { connect: { id: benefit.id } } }] },
    },
    include: { benefits: true },
  })

  const sale = await prisma.sale.create({
    data: {
      user: { connect: { id: admin.id } },
      client: { connect: { id: client.id } },
      unit: { connect: { id: mainUnit.id } },
      total: plan.price,
      method: PaymentMethod.CASH,
      paymentStatus: PaymentStatus.PAID,
      items: {
        create: [{ plan: { connect: { id: plan.id } }, price: plan.price }],
      },
    },
    include: { items: true },
  })

  if (client.profile) {
    await prisma.planProfile.create({
      data: {
        planStartDate: new Date(),
        status: PlanProfileStatus.PAID,
        saleItemId: sale.items[0].id,
        dueDateDebt: 28,
        planId: plan.id,
        profileId: client.profile.id,
        debts: {
          create: [
            {
              value: plan.price,
              status: PaymentStatus.PAID,
              planId: plan.id,
              paymentDate: new Date(),
            },
          ],
        },
      },
    })
  }

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
    owner,
    cashSession,
    itemCoupon,
    plan,
    benefit,
    recurrence,
    manager,
    owner2,
    serviceBarber,
    productBarber,
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
