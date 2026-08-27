import { useState, useEffect } from 'react'

/**
 * Live countdown hook ticking every second towards festival date in IST (+05:30).
 */
export function useCountdown(festivalDate) {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(festivalDate))

  useEffect(() => {
    setTimeLeft(calculateTimeLeft(festivalDate))

    if (!festivalDate) return

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(festivalDate))
    }, 1000)

    return () => clearInterval(timer)
  }, [festivalDate])

  return timeLeft
}

function calculateTimeLeft(festivalDate) {
  if (!festivalDate) {
    return {
      isSet: false,
      isToday: false,
      isPast: false,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      text: 'Set the festival date'
    }
  }

  const now = new Date().getTime()
  // Festival starts at 00:00:00 IST on festivalDate
  const target = new Date(`${festivalDate}T00:00:00+05:30`).getTime()
  // End of festival day (23:59:59 IST)
  const endOfDay = new Date(`${festivalDate}T23:59:59+05:30`).getTime()

  const diff = target - now

  if (diff <= 0) {
    if (now <= endOfDay) {
      return {
        isSet: true,
        isToday: true,
        isPast: false,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        text: 'Today is the day! 🙏 Ganapathi Bappa Morya!'
      }
    }
    return {
      isSet: true,
      isToday: false,
      isPast: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      text: 'The celebration has concluded'
    }
  }

  const totalSeconds = Math.floor(diff / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  let text = ''
  if (days > 0) {
    text = `${days}d ${hours}h ${minutes}m ${seconds}s to go`
  } else if (hours > 0) {
    text = `${hours}h ${minutes}m ${seconds}s to go (Tomorrow!)`
  } else {
    text = `${minutes}m ${seconds}s to go!`
  }

  return {
    isSet: true,
    isToday: false,
    isPast: false,
    days,
    hours,
    minutes,
    seconds,
    text
  }
}

