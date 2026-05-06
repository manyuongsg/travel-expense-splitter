// All monetary values are stored as integer cents (minor units) to avoid
// floating-point errors. Only convert to/from display strings at the UI boundary.

export function centsToDollars(cents) {
  return cents / 100;
}

export function dollarsToCents(dollarsStr) {
  const parsed = parseFloat(dollarsStr.replace(/[^0-9.]/g, ''));
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}

export function formatCurrency(cents, currencyCode = 'USD') {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
    }).format(cents / 100);
  } catch {
    return `${currencyCode} ${(cents / 100).toFixed(2)}`;
  }
}

export function splitEqually(totalCents, numMembers) {
  if (numMembers <= 0) return [];
  const base = Math.floor(totalCents / numMembers);
  const remainder = totalCents % numMembers;
  // Distribute the remainder (penny) to the first N members
  return Array.from({ length: numMembers }, (_, i) => base + (i < remainder ? 1 : 0));
}

export const SUPPORTED_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'SGD', 'HKD', 'MYR',
  'THB', 'IDR', 'PHP', 'VND', 'KRW', 'CNY', 'INR', 'NZD', 'SEK', 'NOK',
];
