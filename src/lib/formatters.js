export const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
})

export const today = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())

export const fmtDate = (date) =>
  date
    ? new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeZone: 'Asia/Kolkata'
      }).format(new Date(`${date}T00:00:00+05:30`))
    : ''

export const dateCountdown = (date) => {
  if (!date) return 'Set the festival date'
  const todayStart = new Date(`${today()}T00:00:00+05:30`).getTime()
  const festivalStart = new Date(`${date}T00:00:00+05:30`).getTime()
  const days = Math.round((festivalStart - todayStart) / 86400000)
  if (days > 1) return `${days} days to go`
  if (days === 1) return 'Tomorrow! 🎉'
  if (days === 0) return 'Today is the day! 🙏'
  return 'The celebration has passed'
}

export const activityClass = (activity) => {
  const day = activity.date
  const todayStr = today()
  if (day < todayStr) return 'Past'
  if (day === todayStr) return 'Live today'
  return 'Upcoming'
}

export const tier = (amount) => {
  const n = Number(amount) || 0
  if (n >= 10000) return 'Platinum'
  if (n >= 5000) return 'Gold'
  if (n >= 1000) return 'Silver'
  return 'Contributor'
}

export const escapeIcs = (value = '') =>
  String(value)
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n')

