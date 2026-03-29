import { useState, useEffect } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { OCRUploadZone } from './OCRUploadZone';
import { OCRResult, EXPENSE_CATEGORIES, COMMON_CURRENCIES } from '../../types';
import { useCurrencyRates, useConvertedAmount } from '../../hooks/useCurrency';
import { useSubmitExpense } from '../../hooks/useExpenses';
import { useAuthStore } from '../../stores/authStore';
import { formatCurrency } from '../../lib/utils';
import { useToast } from '../ui/Toast';
import { ArrowRight } from 'lucide-react';

interface FormData {
  amount: string;
  currency: string;
  category: string;
  description: string;
  expense_date: string;
  merchant_name: string;
}

interface Confidence {
  amount: 'high' | 'low';
  currency: 'high' | 'low';
  category: 'high' | 'low';
  description: 'high' | 'low';
  merchant_name: 'high' | 'low';
}

export function ExpenseForm({ onSuccess }: { onSuccess?: () => void }) {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const submitMutation = useSubmitExpense();

  const baseCurrency = user?.currency_code || 'USD';

  const [form, setForm] = useState<FormData>({
    amount: '',
    currency: baseCurrency,
    category: '',
    description: '',
    expense_date: new Date().toISOString().split('T')[0],
    merchant_name: '',
  });

  const [confidence, setConfidence] = useState<Confidence>({
    amount: 'high',
    currency: 'high',
    category: 'high',
    description: 'high',
    merchant_name: 'high',
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});

  const { data: ratesData } = useCurrencyRates(baseCurrency);
  const convertedAmount = useConvertedAmount(
    parseFloat(form.amount) || 0,
    form.currency,
    baseCurrency,
    ratesData?.rates
  );

  const handleOCR = (result: OCRResult) => {
    setForm((prev) => ({
      ...prev,
      amount: result.amount != null ? String(result.amount) : prev.amount,
      currency: result.currency || prev.currency,
      category: result.category || prev.category,
      description: result.description || prev.description,
      expense_date: result.date || prev.expense_date,
      merchant_name: result.merchant_name || prev.merchant_name,
    }));

    setConfidence({
      amount: result.confidence.amount,
      currency: result.confidence.currency,
      category: result.confidence.category,
      description: result.confidence.description,
      merchant_name: result.confidence.merchant_name,
    });
  };

  const validate = (): boolean => {
    const newErrors: Partial<FormData> = {};
    if (!form.amount || isNaN(parseFloat(form.amount)) || parseFloat(form.amount) <= 0)
      newErrors.amount = 'Valid amount is required';
    if (!form.currency) newErrors.currency = 'Currency is required';
    if (!form.category) newErrors.category = 'Category is required';
    if (!form.description.trim()) newErrors.description = 'Description is required';
    if (!form.expense_date) newErrors.expense_date = 'Date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await submitMutation.mutateAsync({
        amount: parseFloat(form.amount),
        currency: form.currency,
        category: form.category,
        description: form.description,
        expense_date: form.expense_date,
        merchant_name: form.merchant_name || undefined,
      });

      toast('Expense submitted successfully!', 'success');
      setForm({
        amount: '',
        currency: baseCurrency,
        category: '',
        description: '',
        expense_date: new Date().toISOString().split('T')[0],
        merchant_name: '',
      });
      onSuccess?.();
    } catch {
      toast('Failed to submit expense. Please try again.', 'error');
    }
  };

  const currencyOptions = COMMON_CURRENCIES.map((c) => ({ value: c, label: c }));
  const categoryOptions = EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* OCR Upload */}
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-2">Receipt Upload (Optional)</h3>
        <OCRUploadZone onExtracted={handleOCR} />
      </div>

      <div className="border-t border-gray-100" />

      {/* Form Fields */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Amount"
            type="number"
            step="0.01"
            min="0"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            error={errors.amount}
            lowConfidence={confidence.amount === 'low'}
            placeholder="0.00"
          />
          <Select
            label="Currency"
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
            options={currencyOptions}
            error={errors.currency}
            lowConfidence={confidence.currency === 'low'}
          />
        </div>

        {/* Currency Conversion Preview */}
        {convertedAmount !== null && form.currency !== baseCurrency && parseFloat(form.amount) > 0 && (
          <div className="flex items-center gap-2 bg-primary-50 border border-primary-100 rounded-lg px-3 py-2">
            <span className="text-sm text-primary font-medium">
              {formatCurrency(parseFloat(form.amount), form.currency)}
            </span>
            <ArrowRight className="h-4 w-4 text-primary-400" />
            <span className="text-sm text-primary font-semibold">
              {formatCurrency(convertedAmount, baseCurrency)}
            </span>
            <span className="text-xs text-primary-400 ml-auto">Live rate</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            options={categoryOptions}
            placeholder="Select category"
            error={errors.category}
            lowConfidence={confidence.category === 'low'}
          />
          <Input
            label="Expense Date"
            type="date"
            value={form.expense_date}
            onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
            error={errors.expense_date}
          />
        </div>

        <Input
          label="Merchant Name"
          value={form.merchant_name}
          onChange={(e) => setForm({ ...form, merchant_name: e.target.value })}
          placeholder="e.g. Starbucks, Delta Airlines"
          lowConfidence={confidence.merchant_name === 'low'}
        />

        <Textarea
          label="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Brief description of this expense..."
          error={errors.description}
          lowConfidence={confidence.description === 'low'}
          rows={3}
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        loading={submitMutation.isPending}
        size="lg"
      >
        Submit Expense
      </Button>
    </form>
  );
}
