import * as React from "react"
import { ru } from "react-day-picker/locale"
import { CalendarIcon, ClockIcon, MapPinIcon, ScissorsIcon } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Toaster, toast } from "@/components/ui/toast"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { barbers, formatPrice, services, timeSlots } from "@/data"

function Header() {
  return (
    <header className="flex items-center justify-between gap-4">
      <span className="font-heading text-2xl font-bold tracking-[0.15em]">BRITVA</span>
      <Button render={<a href="#book" />}>Записаться</Button>
    </header>
  )
}

function Hero() {
  return (
    <section className="flex flex-col gap-6 border-l-2 border-primary pl-6">
      <Badge variant="secondary">ул. Достык, 18 · ежедневно 10:00–21:00</Badge>
      <h1 className="font-heading text-5xl leading-none font-bold text-balance uppercase sm:text-7xl">
        Стрижка, после которой <span className="text-primary">смотрят</span>
      </h1>
      <p className="max-w-prose text-muted-foreground">
        Мужские стрижки, борода и королевское бритьё. Выберите мастера, день и время, и запись готова без звонков.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button size="lg" render={<a href="#book" />}>
          <CalendarIcon data-icon="inline-start" />
          Выбрать время
        </Button>
        <Button size="lg" variant="outline" render={<a href="#services" />}>
          Цены
        </Button>
      </div>
    </section>
  )
}

function Services() {
  return (
    <section id="services" className="flex scroll-mt-6 flex-col gap-6">
      <h2 className="font-heading text-3xl font-bold uppercase">Услуги</h2>
      <Card>
        <CardContent className="flex flex-col">
          {services.map((s, i) => (
            <React.Fragment key={s.id}>
              {i > 0 && <Separator />}
              <div className="flex items-center justify-between gap-4 py-4">
                <div className="flex min-w-0 flex-col">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {s.minutes} мин · {s.details}
                  </span>
                </div>
                <span className="font-medium whitespace-nowrap text-primary tabular-nums">{formatPrice(s.price)}</span>
              </div>
            </React.Fragment>
          ))}
        </CardContent>
      </Card>
    </section>
  )
}

function Team() {
  return (
    <section className="flex flex-col gap-6">
      <h2 className="font-heading text-3xl font-bold uppercase">Мастера</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {barbers.map((b) => (
          <Card key={b.id}>
            <CardHeader className="flex flex-row items-center gap-4">
              <Avatar className="size-12">
                <AvatarFallback>{b.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-1">
                <CardTitle>{b.name}</CardTitle>
                <CardDescription>{b.role}</CardDescription>
              </div>
            </CardHeader>
            <CardFooter>
              <Badge variant="outline">Стаж {b.years} лет</Badge>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  )
}

function Booking() {
  const [serviceId, setServiceId] = React.useState<string | null>(services[0].id)
  const [barberId, setBarberId] = React.useState<string[]>([barbers[0].id])
  const [date, setDate] = React.useState<Date | undefined>()
  const [time, setTime] = React.useState<string[]>([])
  const [name, setName] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const service = services.find((s) => s.id === serviceId)
  const barber = barbers.find((b) => b.id === barberId[0])
  const phoneValid = phone.replace(/\D/g, "").length >= 10
  const errors = {
    date: !date,
    time: time.length === 0,
    name: name.trim().length < 2,
    phone: !phoneValid,
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    if (Object.values(errors).some(Boolean)) return
    const day = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", weekday: "short" }).format(date)
    toast.add({
      type: "success",
      title: "Вы записаны!",
      description: `${service?.name}, ${day} в ${time[0]}, мастер ${barber?.name}. (демо)`,
    })
  }

  return (
    <section id="book" className="flex scroll-mt-6 flex-col gap-6">
      <h2 className="font-heading text-3xl font-bold uppercase">Запись онлайн</h2>
      <Card>
        <form onSubmit={onSubmit} noValidate>
          <CardContent className="grid gap-8 md:grid-cols-2">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="service">Услуга</FieldLabel>
                <Select value={serviceId} onValueChange={setServiceId}>
                  <SelectTrigger id="service" className="w-full">
                    <SelectValue>{service ? `${service.name} · ${formatPrice(service.price)}` : "Выберите услугу"}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {services.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} · {formatPrice(s.price)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <FieldSet>
                <FieldLegend variant="label">Мастер</FieldLegend>
                <ToggleGroup variant="outline" value={barberId} onValueChange={(v) => v.length && setBarberId(v)}>
                  {barbers.map((b) => (
                    <ToggleGroupItem key={b.id} value={b.id} className="data-pressed:bg-primary data-pressed:text-primary-foreground">
                      {b.name}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </FieldSet>

              <Field data-invalid={submitted && errors.name ? true : undefined}>
                <FieldLabel htmlFor="name">Имя</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  autoComplete="name"
                  placeholder="Например, Арман…"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-invalid={submitted && errors.name ? true : undefined}
                />
                {submitted && errors.name && <FieldError>Напишите имя, чтобы мастер знал, кого ждать.</FieldError>}
              </Field>

              <Field data-invalid={submitted && errors.phone ? true : undefined}>
                <FieldLabel htmlFor="phone">Телефон</FieldLabel>
                <Input
                  id="phone"
                  name="tel"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+7 700 000 00 00…"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  aria-invalid={submitted && errors.phone ? true : undefined}
                />
                {submitted && errors.phone ? (
                  <FieldError>Проверьте номер: нужно минимум 10 цифр.</FieldError>
                ) : (
                  <FieldDescription>Пришлём напоминание за 2 часа.</FieldDescription>
                )}
              </Field>
            </FieldGroup>

            <FieldGroup>
              <FieldSet data-invalid={submitted && errors.date ? true : undefined}>
                <FieldLegend variant="label">День</FieldLegend>
                <Calendar
                  mode="single"
                  locale={ru}
                  selected={date}
                  onSelect={setDate}
                  disabled={{ before: today }}
                  className="rounded-lg border"
                />
                {submitted && errors.date && <FieldError>Выберите день в календаре.</FieldError>}
              </FieldSet>

              <FieldSet data-invalid={submitted && errors.time ? true : undefined}>
                <FieldLegend variant="label">Время</FieldLegend>
                <ToggleGroup
                  variant="outline"
                  spacing={2}
                  className="flex-wrap"
                  value={time}
                  onValueChange={(v) => setTime(v.slice(-1))}
                >
                  {timeSlots.map((t) => (
                    <ToggleGroupItem key={t} value={t} className="tabular-nums data-pressed:bg-primary data-pressed:text-primary-foreground">
                      {t}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                {submitted && errors.time && <FieldError>Выберите удобное время.</FieldError>}
              </FieldSet>
            </FieldGroup>
          </CardContent>
          <CardFooter className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <ClockIcon aria-hidden="true" />
              {service?.minutes} мин · {service && formatPrice(service.price)}
            </span>
            <Button type="submit" size="lg">
              <ScissorsIcon data-icon="inline-start" />
              Записаться
            </Button>
          </CardFooter>
        </form>
      </Card>
    </section>
  )
}

export function App() {
  return (
    <Toaster>
      <div className="min-h-svh bg-background px-4 text-foreground sm:px-6">
        <main className="mx-auto flex max-w-5xl flex-col gap-16 py-6 pb-16">
          <Header />
          <Hero />
          <Services />
          <Team />
          <Booking />
          <footer className="flex flex-col gap-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <MapPinIcon aria-hidden="true" /> ул. Достык, 18 · +7 700 000 00 00
            </span>
            <span>
              Демо-проект{" "}
              <a className="underline underline-offset-4" href="https://osksayan.github.io/pixelstudiokz/">
                Pixel Studio
              </a>
            </span>
          </footer>
        </main>
      </div>
    </Toaster>
  )
}

export default App
