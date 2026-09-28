import { useState } from 'react';
import { useTheme } from '@/app/providers/ThemeContext';
import { ModalOverlay } from '@/layouts';
import { ActionBtn } from '@/shared/components/ui';
import { L713_PLANS } from '@/shared/constants';
import { formatCurrency } from '@/shared/utils';
import type { Enrollment } from '@/domains/enrollments/types';

interface EditPlanModalProps {
  enrollment: Enrollment;
  onClose: () => void;
  onSave: (enrollment: Enrollment, planId: string) => void;
}

export function EditPlanModal({ enrollment, onClose, onSave }: EditPlanModalProps) {
  const { T } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState(enrollment.planId);

  function handleSave() {
    onSave(enrollment, selectedPlan);
    onClose();
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ padding: 28 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: T.text, marginBottom: 4 }}>
          Edit Plan ff
        </div>
        <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 20 }}>
          {enrollment.name} · {enrollment.policyId}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {L713_PLANS.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            return (
              <label
                key={plan.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  border: '1px solid ' + (isSelected ? T.indigo : T.border),
                  background: isSelected ? T.indigo + '12' : T.bg,
                }}
              >
                <input
                  type="radio"
                  checked={isSelected}
                  onChange={() => setSelectedPlan(plan.id)}
                  style={{ accentColor: T.indigo, width: 16, height: 16 }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{plan.name}</div>
                  <div style={{ fontSize: 12, color: T.textMuted }}>{plan.tier}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.indigo }}>
                  {formatCurrency(plan.premium)}/mo
                </div>
              </label>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <ActionBtn label="Cancel" color={T.slate} onClick={onClose} />
          <ActionBtn label="Approve & Save Plan" color={T.indigo} onClick={handleSave} />
        </div>
      </div>
    </ModalOverlay>
  );
}
