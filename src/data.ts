export type Service = {
  id: string
  name: string
  details: string
  minutes: number
  price: number
}

export type Barber = {
  id: string
  name: string
  role: string
  years: number
}

export const services: Service[] = [
  { id: "cut", name: "Мужская стрижка", details: "Мытьё и укладка", minutes: 45, price: 6000 },
  { id: "clipper", name: "Стрижка машинкой", details: "Одна насадка", minutes: 30, price: 4000 },
  { id: "beard", name: "Моделирование бороды", details: "Горячее полотенце", minutes: 30, price: 4500 },
  { id: "combo", name: "Стрижка + борода", details: "Полный образ", minutes: 75, price: 9500 },
  { id: "kids", name: "Детская стрижка", details: "До 12 лет", minutes: 30, price: 3500 },
]

export const barbers: Barber[] = [
  { id: "arman", name: "Арман", role: "Топ-барбер", years: 7 },
  { id: "daniyar", name: "Данияр", role: "Фейды и текстура", years: 4 },
  { id: "timur", name: "Тимур", role: "Борода и бритьё", years: 5 },
]

export const timeSlots = ["10:00", "11:00", "12:30", "14:00", "15:30", "17:00", "18:30", "20:00"]

export const formatPrice = (value: number) =>
  new Intl.NumberFormat("ru-KZ", { style: "currency", currency: "KZT", currencyDisplay: "narrowSymbol", maximumFractionDigits: 0 }).format(value)

// Web app URL of the Google Apps Script in telegram/Code.gs. Empty = demo mode (nothing is sent).
export const BOOKING_URL = ""
