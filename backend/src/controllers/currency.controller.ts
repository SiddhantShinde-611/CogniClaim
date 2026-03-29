import { Request, Response } from 'express';
import { getExchangeRates } from '../services/currency.service';

export const getCurrencies = async (req: Request, res: Response): Promise<void> => {
  try {
    const base = (req.query.base as string) || 'USD';
    const rates = await getExchangeRates(base);
    res.json({
      success: true,
      data: { base, rates, timestamp: new Date().toISOString() },
    });
  } catch (err) {
    console.error('Get currencies error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch exchange rates' });
  }
};
