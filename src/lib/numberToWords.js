/**
 * Converts numbers into Indian Rupee words
 * e.g., 1116 -> "One Thousand One Hundred and Sixteen Rupees Only"
 */
const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
]

const TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
]

function convertLessThanThousand(num) {
  if (num === 0) return ''
  let str = ''

  if (num >= 100) {
    str += ONES[Math.floor(num / 100)] + ' Hundred '
    num %= 100
    if (num > 0) str += 'and '
  }

  if (num >= 20) {
    str += TENS[Math.floor(num / 10)] + ' '
    num %= 10
  }

  if (num > 0) {
    str += ONES[num] + ' '
  }

  return str.trim()
}

export function numberToIndianRupeesWords(amount) {
  const num = Math.floor(Math.abs(Number(amount) || 0))
  if (num === 0) return 'Zero Rupees Only'

  const crore = Math.floor(num / 10000000)
  const lakh = Math.floor((num % 10000000) / 100000)
  const thousand = Math.floor((num % 100000) / 1000)
  const remainder = num % 1000

  let res = ''
  if (crore > 0) {
    res += convertLessThanThousand(crore) + ' Crore '
  }
  if (lakh > 0) {
    res += convertLessThanThousand(lakh) + ' Lakh '
  }
  if (thousand > 0) {
    res += convertLessThanThousand(thousand) + ' Thousand '
  }
  if (remainder > 0) {
    res += convertLessThanThousand(remainder) + ' '
  }

  return `${res.trim()} Rupees Only`
}

