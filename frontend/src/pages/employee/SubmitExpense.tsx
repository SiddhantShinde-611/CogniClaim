import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ExpenseForm } from '../../components/expense/ExpenseForm';
import { ArrowLeft, Sparkles } from 'lucide-react';

export function SubmitExpensePage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">Submit Expense</h1>
          <p className="text-text-secondary text-sm">Upload a receipt for AI-powered extraction</p>
        </div>
      </div>

      {/* AI Banner — copper callout */}
      <div className="border-l-4 border-accent bg-accent-50 rounded-sm px-4 py-3 flex gap-3 items-start">
        <Sparkles className="text-accent h-4 w-4 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-accent-700 font-semibold text-sm">AI Receipt Extraction</p>
          <p className="text-accent-600 text-xs mt-0.5">Upload your receipt and Claude AI will automatically fill in the form. Review and submit!</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expense Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseForm onSuccess={() => navigate('/employee/expenses')} />
        </CardContent>
      </Card>
    </div>
  );
}
