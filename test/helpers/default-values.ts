export const defaultUser = {
  id: 'user-1',
  name: '',
  email: '',
  password: '',
  active: true,
  organizationId: 'org-1',
  unitId: 'unit-1',
  createdAt: new Date(),
  profile: null,
}

export const defaultClient = {
  id: 'client-1',
  name: '',
  email: '',
  password: '',
  active: true,
  organizationId: 'org-1',
  unitId: 'unit-1',
  createdAt: new Date(),
  profile: null,
}

export const barberProfile = {
  id: 'profile-barber',
  phone: '',
  cpf: '',
  genre: '',
  birthday: '',
  pix: '',
  role: 'BARBER' as any,
  commissionPercentage: 50,
  totalBalance: 0,
  userId: 'barber-1',
  createdAt: new Date(),
}

export const barberUser = {
  id: 'barber-1',
  name: '',
  email: '',
  password: '',
  active: true,
  organizationId: 'org-1',
  unitId: 'unit-1',
  createdAt: new Date(),
  profile: barberProfile,
}
