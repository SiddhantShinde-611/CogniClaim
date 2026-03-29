import { prisma } from '../lib/prisma';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function getExchangeRates(baseCurrency = 'USD'): Promise<Record<string, number>> {
  const cached = await prisma.exchangeRateCache.findUnique({
    where: { base_currency: baseCurrency },
  });

  if (cached) {
    const age = Date.now() - cached.fetched_at.getTime();
    if (age < CACHE_TTL_MS) {
      return cached.rates as Record<string, number>;
    }
  }

  const apiKey = process.env.EXCHANGE_RATE_API_KEY;
  if (!apiKey) {
    throw new Error('EXCHANGE_RATE_API_KEY not configured');
  }

  const response = await fetch(
    `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${baseCurrency}`
  );

  if (!response.ok) {
    throw new Error(`Exchange rate API error: ${response.statusText}`);
  }

  const data = await response.json() as { conversion_rates: Record<string, number> };
  const rates = data.conversion_rates;

  await prisma.exchangeRateCache.upsert({
    where: { base_currency: baseCurrency },
    update: { rates, fetched_at: new Date() },
    create: { base_currency: baseCurrency, rates, fetched_at: new Date() },
  });

  return rates;
}

export async function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) return amount;

  const rates = await getExchangeRates('USD');

  const fromRate = fromCurrency === 'USD' ? 1 : rates[fromCurrency];
  const toRate = toCurrency === 'USD' ? 1 : rates[toCurrency];

  if (!fromRate || !toRate) {
    throw new Error(`Unknown currency: ${fromCurrency} or ${toCurrency}`);
  }

  const usdAmount = amount / fromRate;
  return parseFloat((usdAmount * toRate).toFixed(2));
}

export async function getCurrencyFromCountry(countryName: string): Promise<string> {
  try {
    const response = await fetch(
      `https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}?fields=currencies`
    );
    if (!response.ok) return 'USD';

    const data = await response.json() as Array<{ currencies?: Record<string, unknown> }>;
    if (data && data.length > 0 && data[0].currencies) {
      const currencies = data[0].currencies;
      const currencyCode = Object.keys(currencies)[0];
      return currencyCode || 'USD';
    }
  } catch {
    // fall through to default
  }
  return 'USD';
}
