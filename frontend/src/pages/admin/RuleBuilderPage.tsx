import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { RuleBuilder } from '../../components/approval/RuleBuilder';
import { Skeleton } from '../../components/ui/Skeleton';
import { userApi, policyApi } from '../../lib/api';
import { User, ApprovalPolicy } from '../../types';
import { Settings, ChevronRight } from 'lucide-react';

export function RuleBuilderPage() {
  const { data: users = [], isLoading: loadingUsers } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await userApi.getAll();
      return res.data.data;
    },
  });

  const { data: policies = [], isLoading: loadingPolicies } = useQuery<ApprovalPolicy[]>({
    queryKey: ['policies'],
    queryFn: async () => {
      const res = await policyApi.getAll();
      return res.data.data;
    },
  });

  const ruleTypeBadge = (type: string) => {
    const map: Record<string, 'default' | 'warning' | 'success' | 'review'> = {
      SEQUENTIAL: 'default',
      PERCENTAGE: 'warning',
      SPECIFIC: 'success',
      HYBRID: 'review',
    };
    return map[type] || 'default';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Approval Rules</h1>
        <p className="text-gray-500 text-sm">Configure multi-step approval workflows for your team</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create Policy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Create New Policy
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingUsers ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
              </div>
            ) : (
              <RuleBuilder users={users} />
            )}
          </CardContent>
        </Card>

        {/* Existing Policies */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Active Policies</h2>
            <p className="text-sm text-gray-400">{policies.length} configured</p>
          </div>

          {loadingPolicies ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
            </div>
          ) : policies.length === 0 ? (
            <Card className="bg-surface border-dashed">
              <CardContent className="p-8 text-center">
                <Settings className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No policies yet. Create your first approval policy.</p>
              </CardContent>
            </Card>
          ) : (
            policies.map((policy) => (
              <Card key={policy.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-text-primary">{policy.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={ruleTypeBadge(policy.rule_type)}>
                          {policy.rule_type}
                        </Badge>
                        {policy.percentage_threshold && (
                          <span className="text-xs text-gray-400">
                            {policy.percentage_threshold}% threshold
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">{policy.steps.length} steps</span>
                  </div>

                  {/* Steps */}
                  <div className="flex items-center gap-1 flex-wrap mt-2">
                    {policy.steps.map((step, i) => (
                      <div key={step.id} className="flex items-center gap-1">
                        <span className="text-xs bg-primary-50 text-primary px-2 py-0.5 rounded-full font-medium">
                          {step.specific_approver?.email || step.approver_role || '?'}
                        </span>
                        {i < policy.steps.length - 1 && (
                          <ChevronRight className="h-3 w-3 text-gray-300" />
                        )}
                      </div>
                    ))}
                  </div>

                  {policy.specific_approver && (
                    <p className="text-xs text-gray-400 mt-2">
                      Key approver: <span className="font-medium">{policy.specific_approver.email}</span>
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
