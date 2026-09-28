import { useMemo, useState } from 'react';
import { useAuth } from '@/app/providers/AuthContext';
import { useTheme } from '@/app/providers/ThemeContext';
import { Topbar } from '@/layouts';
import { ExpenseListPanel } from './ExpenseListPanel';
import { CashDetailPanel } from './CashDetailPanel';
import styles from './ExpensesPage.module.css';

type TabId = 'expenses' | 'cash';

interface TabDef {
  id: TabId;
  label: string;
  permission: string;
}

// Three separate permissions gate three closely-related screens of one
// epic (PRD §2): expense:create → the entry form (inside ExpenseListPanel's
// "+ Record Expense" button), expense:read → the expense list tab itself,
// cash:read → the cash detail tab itself. Each is checked on its own exact
// permission, never conflated — a user can plausibly hold some but not all
// (e.g. the accountant persona: expense:read + cash:read, no
// expense:create; the cashier persona: none of the three).
const ALL_TABS: TabDef[] = [
  { id: 'expenses', label: 'Expenses', permission: 'expense:read' },
  { id: 'cash', label: 'Cash Detail', permission: 'cash:read' },
];

// SPRINT-015 — Expenses & Cash UI (EPIC-008). One domain covering expense
// entry, the expense list, and the cash detail view (PRD §2), same shape as
// Reports' permission-gated tab pattern (Sprint 8) and Returns' mode-switch
// pattern (Sprint 14) — visibleTabs is filtered by hasPermission per PRD's
// don't-conflate instruction, not a single blanket "expenses" permission.
export function ExpensesPage() {
  const { T } = useTheme();
  const { tenantId, tenantName, hasPermission } = useAuth();

  const visibleTabs = useMemo(
    () => ALL_TABS.filter((t) => hasPermission(t.permission)),
    [hasPermission]
  );

  const [activeTab, setActiveTab] = useState<TabId | null>(visibleTabs[0]?.id ?? null);
  const currentTab = visibleTabs.find((t) => t.id === activeTab) ?? visibleTabs[0] ?? null;

  if (visibleTabs.length === 0 || tenantId == null) {
    return (
      <div>
        <Topbar title="Expenses & Cash" subtitle={tenantName ?? undefined} />
        <div style={{ padding: 32, color: T.textMuted, fontSize: 14 }}>
          You don&apos;t have permission to view expenses or cash detail.
        </div>
      </div>
    );
  }

  return (
    <div>
      <Topbar title="Expenses & Cash" subtitle={tenantName ?? undefined} />

      {visibleTabs.length > 1 && (
        <div className={styles.tabBar}>
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={styles.tabButton}
              style={{
                color: currentTab?.id === tab.id ? T.indigo : T.textMuted,
                borderBottom: `2px solid ${currentTab?.id === tab.id ? T.indigo : 'transparent'}`,
                fontWeight: currentTab?.id === tab.id ? 700 : 500,
              }}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div className={styles.tabContent}>
        {currentTab?.id === 'expenses' && <ExpenseListPanel tenantId={tenantId} />}
        {currentTab?.id === 'cash' && <CashDetailPanel tenantId={tenantId} />}
      </div>
    </div>
  );
}

export default ExpensesPage;
