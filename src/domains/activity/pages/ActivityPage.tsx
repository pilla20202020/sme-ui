import { useState, useMemo, useEffect } from 'react';
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table';
import { HiOutlineSearch } from 'react-icons/hi';
import { useTheme } from '@/app/providers/ThemeContext';
import { EnrollmentTable, DatePicker } from '@/shared/components/ui';
import { Topbar } from '@/layouts';
import styles from './ActivityPage.module.css';

export interface ActivityRecord {
  id: string;
  member: string;
  action: string;
  status: string;
  time: string;
  date: string;
  agent: string;
  caseId: string;
}

const ALL_ACTIVITIES: ActivityRecord[] = [
  {
    id: 'ACT-001',
    member: 'Maria Johnson',
    action: 'Enrollment submitted',
    status: 'Pending Underwriting',
    time: '2 min ago',
    date: '2026-05-28',
    agent: 'David Park',
    caseId: 'L713-1001',
  },
  {
    id: 'ACT-002',
    member: 'James Williams',
    action: 'Questions answered',
    status: 'Pending Response',
    time: '8 min ago',
    date: '2026-05-28',
    agent: 'Lisa Chen',
    caseId: 'L713-1002',
  },
  {
    id: 'ACT-003',
    member: 'Robert Chen',
    action: 'Signature received',
    status: 'Ready to Activate',
    time: '15 min ago',
    date: '2026-05-28',
    agent: 'Sarah Kim',
    caseId: 'L713-1003',
  },
  {
    id: 'ACT-004',
    member: 'Linda Patel',
    action: 'Plan approved',
    status: 'Pending Signature',
    time: '22 min ago',
    date: '2026-05-28',
    agent: 'David Park',
    caseId: 'L713-1004',
  },
  {
    id: 'ACT-005',
    member: 'Michael Kim',
    action: 'Policy activated',
    status: 'Active',
    time: '35 min ago',
    date: '2026-05-28',
    agent: 'Lisa Chen',
    caseId: 'L713-1005',
  },
  {
    id: 'ACT-006',
    member: 'Sarah Anderson',
    action: 'Declined — pre-existing',
    status: 'Declined by UW',
    time: '1h ago',
    date: '2026-05-28',
    agent: 'Sarah Kim',
    caseId: 'L713-1006',
  },
  {
    id: 'ACT-007',
    member: 'David Martinez',
    action: 'Reminder sent',
    status: 'Pending Response',
    time: '1h ago',
    date: '2026-05-28',
    agent: 'David Park',
    caseId: 'L713-1007',
  },
  {
    id: 'ACT-008',
    member: 'Jennifer Lee',
    action: 'Notes updated',
    status: 'Pending Underwriting',
    time: '2h ago',
    date: '2026-05-28',
    agent: 'Lisa Chen',
    caseId: 'L713-1008',
  },
  {
    id: 'ACT-009',
    member: 'Thomas Brown',
    action: 'Enrollment submitted',
    status: 'Pending Underwriting',
    time: '3h ago',
    date: '2026-05-27',
    agent: 'Sarah Kim',
    caseId: 'L713-1009',
  },
  {
    id: 'ACT-010',
    member: 'Emily Davis',
    action: 'Plan modified',
    status: 'Pending Signature',
    time: '4h ago',
    date: '2026-05-27',
    agent: 'David Park',
    caseId: 'L713-1010',
  },
  {
    id: 'ACT-011',
    member: 'Chris Wilson',
    action: 'Policy activated',
    status: 'Active',
    time: '5h ago',
    date: '2026-05-27',
    agent: 'Lisa Chen',
    caseId: 'L713-1011',
  },
  {
    id: 'ACT-012',
    member: 'Amanda Taylor',
    action: 'Signature received',
    status: 'Ready to Activate',
    time: '6h ago',
    date: '2026-05-27',
    agent: 'Sarah Kim',
    caseId: 'L713-1012',
  },
  {
    id: 'ACT-013',
    member: 'Kevin Harris',
    action: 'Questions answered',
    status: 'Pending Response',
    time: '8h ago',
    date: '2026-05-27',
    agent: 'David Park',
    caseId: 'L713-1013',
  },
  {
    id: 'ACT-014',
    member: 'Rachel Clark',
    action: 'Declined — risk factors',
    status: 'Declined by UW',
    time: '10h ago',
    date: '2026-05-27',
    agent: 'Lisa Chen',
    caseId: 'L713-1014',
  },
  {
    id: 'ACT-015',
    member: 'Jason Moore',
    action: 'Enrollment submitted',
    status: 'Pending Underwriting',
    time: '12h ago',
    date: '2026-05-26',
    agent: 'Sarah Kim',
    caseId: 'L713-1015',
  },
];

const columnHelper = createColumnHelper<ActivityRecord>();

const STATUS_OPTIONS = Array.from(new Set(ALL_ACTIVITIES.map((a) => a.status))).sort();
const AGENT_OPTIONS = Array.from(new Set(ALL_ACTIVITIES.map((a) => a.agent))).sort();

const EMPTY_FILTERS = {
  searchId: '',
  memberName: '',
  status: '',
  agent: '',
  date: '',
};

export function ActivityPage() {
  const { T } = useTheme();
  const [quickSearch, setQuickSearch] = useState('');
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const t = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(t);
  }, [quickSearch, filters]);

  const filtered = useMemo(() => {
    let data = ALL_ACTIVITIES;
    if (quickSearch.trim()) {
      const q = quickSearch.trim().toLowerCase();
      data = data.filter(
        (a) =>
          a.member.toLowerCase().includes(q) ||
          a.action.toLowerCase().includes(q) ||
          a.caseId.toLowerCase().includes(q) ||
          a.agent.toLowerCase().includes(q)
      );
    }
    if (filters.searchId.trim()) {
      const q = filters.searchId.trim().toLowerCase();
      data = data.filter(
        (a) => a.caseId.toLowerCase().includes(q) || a.id.toLowerCase().includes(q)
      );
    }
    if (filters.memberName.trim()) {
      const q = filters.memberName.trim().toLowerCase();
      data = data.filter((a) => a.member.toLowerCase().includes(q));
    }
    if (filters.status) {
      data = data.filter((a) => a.status === filters.status);
    }
    if (filters.agent) {
      data = data.filter((a) => a.agent === filters.agent);
    }
    if (filters.date) {
      data = data.filter((a) => a.date === filters.date);
    }
    return data;
  }, [quickSearch, filters]);

  function handleSearch() {
    setFilters(draft);
  }

  function handleClear() {
    setQuickSearch('');
    setDraft(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
  }

  const columns = useMemo(
    (): ColumnDef<ActivityRecord, any>[] => [
      columnHelper.accessor('caseId', {
        header: 'System ID',
        size: 120,
        cell: (info) => <span className={styles.caseId}>{info.getValue()}</span>,
      }),
      columnHelper.accessor('member', {
        header: 'Member',
        size: 180,
        cell: (info) => <span className={styles.memberName}>{info.getValue()}</span>,
      }),
      columnHelper.accessor('action', {
        header: 'Action',
        size: 200,
        cell: (info) => <span className={styles.actionText}>{info.getValue()}</span>,
      }),
      columnHelper.accessor('agent', {
        header: 'Agent',
        size: 150,
        cell: (info) => <span className={styles.agentName}>{info.getValue()}</span>,
      }),
      columnHelper.accessor('time', {
        header: 'Time',
        size: 100,
        cell: (info) => <span className={styles.timeText}>{info.getValue()}</span>,
      }),
      columnHelper.accessor('date', {
        header: 'Date',
        size: 120,
        cell: (info) => <span className={styles.dateText}>{info.getValue()}</span>,
      }),
    ],
    []
  );

  return (
    <div style={{ background: T.bg, minHeight: '100vh' }}>
      <Topbar
        title="Activity Log"
        subtitle="L713 Medical Underwriting · All Activity"
        compactMobile
      />
      <div className={styles.mobileHeaderMeta}>
        <div className={styles.mobileHeaderTitle}>Activity Log</div>
        <div className={styles.mobileHeaderSubtitle}>L713 Medical Underwriting · All Activity</div>
      </div>
      <div className={styles.pageWrapper} style={{ background: T.bg }}>
        {/* Search & Filters */}
        <div
          className={styles.filterSection}
          style={{ background: T.bgCard, borderColor: T.border }}
        >
          <div className={styles.filterSectionHeader}>
            <span className={styles.filterSectionTitle} style={{ color: T.text }}>
              Search &amp; Filters
            </span>
          </div>

          <div className={styles.filterGrid}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel} style={{ color: T.textSecondary }}>
                Search ID
              </label>
              <input
                className={styles.filterInput}
                placeholder="e.g. L713-1001"
                value={draft.searchId}
                onChange={(e) => setDraft((d) => ({ ...d, searchId: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                style={{ background: T.bg, color: T.text, borderColor: T.border }}
              />
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel} style={{ color: T.textSecondary }}>
                Member Name
              </label>
              <input
                className={styles.filterInput}
                placeholder="e.g. Maria Johnson"
                value={draft.memberName}
                onChange={(e) => setDraft((d) => ({ ...d, memberName: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                style={{ background: T.bg, color: T.text, borderColor: T.border }}
              />
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel} style={{ color: T.textSecondary }}>
                Status
              </label>
              <select
                className={styles.filterSelect}
                value={draft.status}
                onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
                style={{ background: T.bg, color: T.text, borderColor: T.border }}
              >
                <option value="">All Statuses</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel} style={{ color: T.textSecondary }}>
                Agent
              </label>
              <select
                className={styles.filterSelect}
                value={draft.agent}
                onChange={(e) => setDraft((d) => ({ ...d, agent: e.target.value }))}
                style={{ background: T.bg, color: T.text, borderColor: T.border }}
              >
                <option value="">All Agents</option>
                {AGENT_OPTIONS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel} style={{ color: T.textSecondary }}>
                Date
              </label>
              <DatePicker
                value={draft.date}
                onChange={(date) => setDraft((d) => ({ ...d, date }))}
                placeholder="Select date"
              />
            </div>
          </div>

          <div className={styles.filterActionsRow} style={{ borderTopColor: T.borderLight }}>
            <button className={styles.clearFiltersBtn} onClick={handleClear} type="button">
              Clear
            </button>
            <button className={styles.searchBtn} onClick={handleSearch} type="button">
              <HiOutlineSearch size={14} />
              Search
            </button>
          </div>
        </div>

        {/* Table Card */}
        <div className={styles.tableCard} style={{ background: T.bgCard }}>
          <EnrollmentTable
            data={filtered}
            columns={columns}
            pageSize={10}
            showPagination={true}
            showTopPagination={true}
            emptyMessage="No activity matches your filters."
            isLoading={isLoading}
            skeletonRows={10}
          />
        </div>
      </div>
    </div>
  );
}
