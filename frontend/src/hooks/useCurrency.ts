import { useQuery } from '@tanstack/react-query';
import { currencyApi } from '../lib/api';
import { ExchangeRates } from '../types';

export function useCurrencyRates(base = 'USD') {
  return useQuery<ExchangeRates>({
    queryKey: ['currencies', base],
    queryFn: async () => {
      const res = await currencyApi.getRates(base);
      return res.data.data;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useConvertedAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates?: Record<string, number>
): number | null {
  if (!rates || !amount || !fromCurrency || !toCurrency) return null;
  if (fromCurrency === toCurrency) return amount;

  const fromRate = fromCurrency === 'USD' ? 1 : rates[fromCurrency];
  const toRate = toCurrency === 'USD' ? 1 : rates[toCurrency];

  if (!fromRate || !toRate) return null;

  const usdAmount = amount / fromRate;
  return parseFloat((usdAmount * toRate).toFixed(2));
}
