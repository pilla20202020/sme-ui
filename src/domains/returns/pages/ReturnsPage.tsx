import { useState } from 'react';
import { useAuth } from '@/app/providers/AuthContext';
import { useTheme } from '@/app/providers/ThemeContext';
import { Topbar } from '@/layouts';
import { MatchedReturnPanel } from './MatchedReturnPanel';
import { OverrideReturnPanel } from './OverrideReturnPanel';
import styles from './Returns.module.css';

type Mode = 'matched' | 'override';

// SPRINT-014 — Returns UI (EPIC-007). One domain covering both stories: a
// permission-gated (returns:create) mode switch between STORY-052's matched
// return flow (looked up against an original sale) and STORY-053's manager-
// override flow for a return with no original sale at all. Both post to the
// same POST /returns endpoint — which branch runs is selected purely by
// whether the request body includes a saleId (PRD §2/§4).
//
// No returns list/browse screen here on purpose — there is no backend list
// endpoint (only GET .../:returnId), so this sprint doesn't build one (PRD
// §5 explicit deferral, not an oversight).
export function ReturnsPage() {
  const { T } = useTheme();
  const { tenantId, tenantName, hasPermission } = useAuth();
  const [mode, setMode] = useState<Mode>('matched');

  const canCreate = hasPermission('returns:create');

  if (!canCreate) {
    return (
      <div>
        <Topbar title="Returns" subtitle={tenantName ?? undefined} />
        <div style={{ padding: 32, color: T.textMuted, fontSize: 14 }}>
          You don&apos;t have permission to process returns.
        </div>
      </div>
    );
  }

  return (
    <div>
      <Topbar title="Returns" subtitle={tenantName ?? undefined} />
      <div className={styles.wrap}>
        <div className={styles.tabBar}>
          <button
            type="button"
            className={styles.tab}
            style={
              mode === 'matched'
                ? { background: T.indigo, borderColor: T.indigo, color: '#fff' }
                : { borderColor: T.border, color: T.textMuted }
            }
            onClick={() => setMode('matched')}
          >
            Process a Return
          </button>
          <button
            type="button"
            className={styles.tab}
            style={
              mode === 'override'
                ? { background: T.indigo, borderColor: T.indigo, color: '#fff' }
                : { borderColor: T.border, color: T.textMuted }
            }
            onClick={() => setMode('override')}
          >
            Manager Override (No Original Sale)
          </button>
        </div>

        {tenantId != null &&
          (mode === 'matched' ? (
            <MatchedReturnPanel tenantId={tenantId} />
          ) : (
            <OverrideReturnPanel tenantId={tenantId} />
          ))}
      </div>
    </div>
  );
}

export default ReturnsPage;
