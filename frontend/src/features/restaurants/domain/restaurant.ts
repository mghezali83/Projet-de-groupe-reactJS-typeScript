export interface Restaurant {
  id: number
  name: string
  city: string
  address: string
  is_open: boolean
  opening_hours: string
  contact: string
}

export interface ApiHealth {
  status: string
}
