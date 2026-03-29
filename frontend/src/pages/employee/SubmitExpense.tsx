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
          <h1 className="text-2xl font-bold text-text-primary">Submit Expense</h1>
          <p className="text-gray-500 text-sm">Upload a receipt for AI-powered extraction</p>
        </div>
      </div>

      {/* AI Banner */}
      <div className="bg-gradient-to-r from-primary-50 to-purple-50 border border-primary-100 rounded-xl px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-medium text-primary">AI Receipt Extraction</p>
          <p className="text-xs text-primary-500">Upload your receipt and Claude AI will automatically fill in the form. Review and submit!</p>
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
