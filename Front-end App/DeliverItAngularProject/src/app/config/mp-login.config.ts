export interface MpAccount {
  email: string
  password: string
  label: string
}

export const MP_ACCOUNTS: MpAccount[] = [
  { email: 'owner@gmail.com', password: 'aaaaaaaa', label: 'Dueño de Local' },
  { email: 'delivery@gmail.com', password: 'aaaaaaaa', label: 'Repartidor' },
  { email: 'fabriortenzi10@gmail.com', password: 'aaaaaaaa', label: 'Fabrizio Ortenzi' },
  { email: 'test@test.com', password: 'aaaaaaaa', label: 'Test Delivery' },
  { email: 'test-delivery@test.com', password: 'aaaaaaaa', label: 'Test Owner' },
  { email: 'test-owner@test.com', password: 'aaaaaaaa', label: 'Fabrizio Ortenzi' },
]
