import { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { User } from '../../types';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { policyApi } from '../../lib/api';
import { useToast } from '../ui/Toast';
import { useQueryClient } from '@tanstack/react-query';

interface Step {
  step_order: number;
  approver_role?: string;
  approver_user_id?: string;
}

interface Props {
  users: User[];
  onCreated?: () => void;
}

const ruleTypeDescriptions = {
  SEQUENTIAL: 'All approvers must approve in order, one step at a time.',
  PERCENTAGE: 'Expense is approved when X% of approvers have approved.',
  SPECIFIC: 'Expense is approved when a specific named approver approves.',
  HYBRID: 'Expense is approved when either the percentage threshold OR the specific approver approves.',
};

export function RuleBuilder({ users, onCreated }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [ruleType, setRuleType] = useState<'SEQUENTIAL' | 'PERCENTAGE' | 'SPECIFIC' | 'HYBRID'>('SEQUENTIAL');
  const [percentageThreshold, setPercentageThreshold] = useState('');
  const [specificApproverId, setSpecificApproverId] = useState('');
  const [steps, setSteps] = useState<Step[]>([{ step_order: 1, approver_role: 'MANAGER' }]);
  const [saving, setSaving] = useState(false);

  const addStep = () => {
    setSteps([...steps, { step_order: steps.length + 1, approver_role: 'MANAGER' }]);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, step_order: i + 1 })));
  };

  const updateStep = (index: number, updates: Partial<Step>) => {
    setSteps(steps.map((s, i) => (i === index ? { ...s, ...updates } : s)));
  };

  const generatePreview = (): string => {
    if (steps.length === 0) return 'Add at least one step.';

    const stepDescs = steps.map((s, i) => {
      const approver = s.approver_user_id
        ? users.find((u) => u.id === s.approver_user_id)?.email || 'Unknown User'
        : s.approver_role || 'Any';
      return `Step ${i + 1}: ${approver}`;
    });

    const base = stepDescs.join(' → ');

    switch (ruleType) {
      case 'SEQUENTIAL':
        return `${base}. All must approve in sequence.`;
      case 'PERCENTAGE':
        return `${base}. Approved when ${percentageThreshold || 'X'}% of approvers have approved.`;
      case 'SPECIFIC': {
        const specific = specificApproverId
          ? users.find((u) => u.id === specificApproverId)?.email
          : 'Specific Approver';
        return `${base}. Approved when ${specific} approves.`;
      }
      case 'HYBRID': {
        const specific = specificApproverId
          ? users.find((u) => u.id === specificApproverId)?.email
          : 'Specific Approver';
        return `${base}. Approved when ${percentageThreshold || 'X'}% have approved OR ${specific} approves.`;
      }
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast('Policy name is required', 'error');
      return;
    }
    if (steps.length === 0) {
      toast('At least one step is required', 'error');
      return;
    }

    setSaving(true);
    try {
      await policyApi.create({
        name: name.trim(),
        rule_type: ruleType,
        percentage_threshold: percentageThreshold ? parseFloat(percentageThreshold) : undefined,
        specific_approver_id: specificApproverId || undefined,
        steps: steps.map((s) => ({
          step_order: s.step_order,
          approver_role: s.approver_user_id ? undefined : s.approver_role,
          approver_user_id: s.approver_user_id || undefined,
        })),
      });

      toast('Approval policy created!', 'success');
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      setName('');
      setSteps([{ step_order: 1, approver_role: 'MANAGER' }]);
      setRuleType('SEQUENTIAL');
      setPercentageThreshold('');
      setSpecificApproverId('');
      onCreated?.();
    } catch {
      toast('Failed to create policy', 'error');
    } finally {
      setSaving(false);
    }
  };

  const userOptions = [{ value: '', label: 'Use role instead' }, ...users.map((u) => ({ value: u.id, label: u.email }))];
  const roleOptions = [
    { value: 'ADMIN', label: 'Admin' },
    { value: 'MANAGER', label: 'Manager' },
    { value: 'EMPLOYEE', label: 'Employee' },
  ];

  return (
    <div className="space-y-6">
      <Input
        label="Policy Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Standard Expense Approval"
      />

      <Select
        label="Rule Type"
        value={ruleType}
        onChange={(e) => setRuleType(e.target.value as typeof ruleType)}
        options={[
          { value: 'SEQUENTIAL', label: 'Sequential' },
          { value: 'PERCENTAGE', label: 'Percentage' },
          { value: 'SPECIFIC', label: 'Specific Approver' },
          { value: 'HYBRID', label: 'Hybrid' },
        ]}
      />

      <p className="text-xs text-gray-500 bg-surface rounded-lg px-3 py-2 border border-gray-100">
        {ruleTypeDescriptions[ruleType]}
      </p>

      {/* Conditional fields */}
      {(ruleType === 'PERCENTAGE' || ruleType === 'HYBRID') && (
        <Input
          label="Percentage Threshold (%)"
          type="number"
          min="1"
          max="100"
          value={percentageThreshold}
          onChange={(e) => setPercentageThreshold(e.target.value)}
          placeholder="e.g. 50"
        />
      )}

      {(ruleType === 'SPECIFIC' || ruleType === 'HYBRID') && (
        <Select
          label="Specific Approver"
          value={specificApproverId}
          onChange={(e) => setSpecificApproverId(e.target.value)}
          options={users.map((u) => ({ value: u.id, label: u.email }))}
          placeholder="Select approver"
        />
      )}

      {/* Steps */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-text-primary">Approval Steps</h4>
          <Button variant="outline" size="sm" onClick={addStep}>
            <Plus className="h-4 w-4" />
            Add Step
          </Button>
        </div>

        {steps.map((step, index) => (
          <Card key={index} className="border-gray-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-gray-400">
                  <GripVertical className="h-4 w-4" />
                  <Badge variant="gray" className="w-6 h-6 rounded-full p-0 justify-center">
                    {step.step_order}
                  </Badge>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <Select
                    label="Specific User (optional)"
                    value={step.approver_user_id || ''}
                    onChange={(e) => updateStep(index, {
                      approver_user_id: e.target.value || undefined,
                      approver_role: e.target.value ? undefined : step.approver_role,
                    })}
                    options={userOptions}
                  />
                  {!step.approver_user_id && (
                    <Select
                      label="Approver Role"
                      value={step.approver_role || 'MANAGER'}
                      onChange={(e) => updateStep(index, { approver_role: e.target.value })}
                      options={roleOptions}
                    />
                  )}
                </div>
                {steps.length > 1 && (
                  <button
                    onClick={() => removeStep(index)}
                    className="text-danger hover:text-red-700 transition-colors p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Live Preview */}
      <Card className="bg-primary-50 border-primary-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-primary">Rule Preview</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-primary-700">{generatePreview()}</p>
        </CardContent>
      </Card>

      <Button onClick={handleSave} loading={saving} className="w-full">
        Save Policy
      </Button>
    </div>
  );
}
