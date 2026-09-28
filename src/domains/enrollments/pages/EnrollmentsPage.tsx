import { useMemo, useState, useCallback, useEffect } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { useTheme } from '@/app/providers/ThemeContext';
import { Topbar } from '@/layouts';
import { StatusBadge, EnrollmentTable } from '@/shared/components/ui';
import { formatDate, formatCurrency } from '@/shared/utils';
import { useEnrollmentStore } from '@/stores/enrollmentStore';
import type { Enrollment, EnrollmentStatus } from '@/domains/enrollments/types';
import { Tooltip } from '@patternfly/react-core';
import {
  HiOutlineLocationMarker,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineSearch,
  HiOutlineX,
  HiOutlineShieldCheck,
  HiOutlineAnnotation,
  HiOutlineExclamationCircle,
} from 'react-icons/hi';
import { AiOutlineDoubleRight } from 'react-icons/ai';
import styles from './EnrollmentsPage.module.css';

import { STATUS_FILTERS } from '@/shared/constants';

const TAB_LABELS: Record<string, string> = {
  'Pending Underwriting': 'Pending Underwriting',
  'Pending Response': 'Pending Response',
  'Pending Signature': 'Pending Signature',
  'Ready to Activate': 'Ready to Activate',
  Active: 'Active',
  'Declined by UW': 'Declined by UW',
  'Declined by Member': 'Declined by Member',
  Termed: 'Termed',
  All: 'All',
};
const columnHelper = createColumnHelper<Enrollment>();

interface EnrollmentsPageProps {
  filtered: Enrollment[];
  counts: Record<string, number>;
  filterStatus: EnrollmentStatus | 'All' | 'Termed';
  setFilterStatus: (status: EnrollmentStatus | 'All' | 'Termed') => void;
  searchText: string;
  setSearchText: (text: string) => void;
  carrierFilter: string;
  setCarrierFilter: (carrier: string) => void;
  sortCol: keyof Enrollment | null;
  sortDir: 'asc' | 'desc';
  handleSort: (col: keyof Enrollment) => void;
  onNavigateDashboard: () => void;
  renderActions: (enrollment: Enrollment) => React.ReactNode;
  onOpenDrawer: (enrollment: Enrollment) => void;
  onViewMedicalDetails: (enrollment: Enrollment) => void;
  onBulkApprove?: (enrollments: Enrollment[]) => void;
  isLoading?: boolean;
}

export function EnrollmentsPage({
  filtered,
  counts,
  filterStatus,
  setFilterStatus,
  searchText,
  setSearchText,
  renderActions,
  onOpenDrawer,
  onViewMedicalDetails,
  onBulkApprove,
  isLoading,
}: EnrollmentsPageProps) {
  const { T } = useTheme();
  const openModal = useEnrollmentStore((state) => state.openModal);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [, setBulkResult] = useState<{ success: string[]; failed: string[] } | null>(null);
  const [pageSize, setPageSize] = useState(10);

  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!searchText) {
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const t = setTimeout(() => setIsSearching(false), 400);
    return () => clearTimeout(t);
  }, [searchText]);

  const isPendingSig = filterStatus === 'Pending Signature';
  const pendingSigEnrollments = useMemo(
    () => filtered.filter((e) => e.status === 'Pending Signature'),
    [filtered]
  );
  const allSelected =
    pendingSigEnrollments.length > 0 && pendingSigEnrollments.every((e) => selectedIds.has(e.key));

  const toggleSelect = useCallback((key: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingSigEnrollments.map((e) => e.key)));
    }
  }, [allSelected, pendingSigEnrollments]);

  const handleBulkApprove = useCallback(() => {
    const selected = pendingSigEnrollments.filter((e) => selectedIds.has(e.key));
    if (!selected.length) return;
    // Validate: all must be Pending Signature
    const valid = selected.filter((e) => e.status === 'Pending Signature');
    const invalid = selected.filter((e) => e.status !== 'Pending Signature');
    if (onBulkApprove) onBulkApprove(valid);
    setBulkResult({
      success: valid.map((e) => e.policyId),
      failed: invalid.map((e) => e.policyId),
    });
    setSelectedIds(new Set());
  }, [pendingSigEnrollments, selectedIds, onBulkApprove]);

  const columns = useMemo(
    () => [
      ...(isPendingSig
        ? [
            // TODO: temporarily disabled — bring back the select-all checkbox column
            /*
            columnHelper.display({
              id: 'select',
              header: () => (
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  aria-label="Select all pending signature"
                  style={{
                    cursor: 'pointer',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    border: `1.5px solid ${allSelected ? T.indigo : T.border}`,
                    background: allSelected ? T.indigo : '#ffffff',
                    backgroundImage: allSelected
                      ? `url("data:image/svg+xml,%3Csvg viewBox='0 0 10 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 4L3.5 6.5L9 1' stroke='white' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`
                      : 'none',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center',
                    backgroundSize: '10px 8px',
                    flexShrink: 0,
                  }}
                />
              ),
              size: 40,
              cell: (info) => {
                const e = info.row.original;
                if (e.status !== 'Pending Signature') return null;
                return (
                  <input
                    type="checkbox"
                    checked={selectedIds.has(e.key)}
                    onChange={() => toggleSelect(e.key)}
                    aria-label={`Select ${e.policyId}`}
                    style={{
                      cursor: 'pointer',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      width: 16,
                      height: 16,
                      borderRadius: 4,
                      border: `1.5px solid ${selectedIds.has(e.key) ? T.indigo : T.border}`,
                      background: selectedIds.has(e.key) ? T.indigo : '#ffffff',
                      backgroundImage: selectedIds.has(e.key)
                        ? `url("data:image/svg+xml,%3Csvg viewBox='0 0 10 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 4L3.5 6.5L9 1' stroke='white' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`
                        : 'none',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                      backgroundSize: '10px 8px',
                      flexShrink: 0,
                    }}
                  />
                );
              },
            }),
            */
          ]
        : []),
      columnHelper.accessor('policyId', {
        header: 'ID',
        size: 160,
        cell: (info) => {
          const enrollment = info.row.original;
          const latestNote =
            enrollment.notes.length > 0 ? enrollment.notes[enrollment.notes.length - 1].text : null;
          const adminUrl = import.meta.env.VITE_ADMIN_SITE_URL;
          return (
            <div className={styles.cellIdGroup}>
              <a
                href={`${adminUrl}/ClientsDetail/${enrollment.policyId}`}
                target="_blank"
                rel="noreferrer"
                className={styles.cellCaseIdBtn}
              >
                {enrollment.policyId}
              </a>
              <div className={styles.cellSubText}>{enrollment.userId}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <StatusBadge status={enrollment.status} />
                {enrollment.answeredQuestions && (
                  <span className={styles.newUpdatePill}>Responded</span>
                )}
              </div>
              {latestNote && (
                <button
                  type="button"
                  className={styles.cellNoteInline}
                  onClick={() => openModal('notes', enrollment)}
                  title="View More Notes"
                >
                  <HiOutlineAnnotation size={11} className={styles.cellNoteInlineIcon} />
                  <span className={styles.cellNoteInlineText}>{latestNote}</span>
                  <span className={styles.cellNoteViewMore}>
                    <AiOutlineDoubleRight />
                  </span>
                </button>
              )}
              {enrollment.rejectionReason && (
                <div className={styles.cellReasonInline}>
                  <HiOutlineExclamationCircle size={12} className={styles.cellReasonInlineIcon} />
                  <Tooltip
                    content={enrollment.rejectionReason}
                    className={styles.rejectionTooltip}
                    isContentLeftAligned
                  >
                    <span className={styles.cellReasonInlineText}>
                      {enrollment.rejectionReason}
                    </span>
                  </Tooltip>
                </div>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor('name', {
        header: 'Member Details',
        size: 220,
        cell: (info) => {
          const enrollment = info.row.original;
          return (
            <div className={styles.cellMemberGroup}>
              <div className={styles.cellMemberName}>{enrollment.name}</div>
              <div className={styles.cellMemberDetail}>
                <HiOutlineLocationMarker className={styles.cellMemberIcon} />
                <span>{enrollment.address}</span>
              </div>
              <div className={`${styles.cellMemberDetail} ${styles.enrollText}`}>
                <HiOutlineMail className={styles.cellMemberIcon} />
                <span>
                  <a href={`mailto:${enrollment.email}`} className={styles.enrollText}>
                    {enrollment.email}
                  </a>
                </span>
              </div>
              <div className={`${styles.cellMemberDetail} ${styles.enrollText}`}>
                <HiOutlinePhone className={styles.cellMemberIcon} />
                <span>
                  <a
                    href={`tel:+1${enrollment.phone.replace(/\D/g, '')}`}
                    className={styles.enrollText}
                  >
                    {enrollment.phone}
                  </a>
                </span>
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor('agentName', {
        header: 'Agent / Group',
        size: 180,
        cell: (info) => {
          const enrollment = info.row.original;
          const adminUrl = import.meta.env.VITE_ADMIN_SITE_URL;
          return (
            <div className={styles.cellAgentGroup}>
              <a
                href={`${adminUrl}/agent/${enrollment.agentId}/detail`}
                target="_blank"
                rel="noreferrer"
                className={styles.cellAgentName}
              >
                {enrollment.agentName}
              </a>
              <a
                href={`${adminUrl}/group/${enrollment.groupId}/detail`}
                target="_blank"
                rel="noreferrer"
                className={styles.cellSubText}
              >
                {enrollment.groupName}
              </a>
            </div>
          );
        },
      }),
      columnHelper.accessor('effectiveDate', {
        header: 'Dates',
        size: 130,
        cell: (info) => {
          const enrollment = info.row.original;
          return (
            <div className={styles.cellDatesGroup}>
              <div className={styles.cellDateRow}>
                <span className={styles.cellDateLabel}>Effective:</span>
                <span className={styles.cellDateValue}>
                  {enrollment.effectiveDate ? formatDate(enrollment.effectiveDate) : 'N/A'}
                </span>
              </div>
              <div className={styles.cellDateRow}>
                <span className={styles.cellDateLabel}>Enrolled:</span>
                <span className={styles.cellDateValue}>{formatDate(enrollment.enrollDate)}</span>
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor('planName', {
        header: 'Plan & Premium',
        size: 200,
        cell: (info) => {
          const enrollment = info.row.original;
          return (
            <div className={styles.cellPlanGroup}>
              <div className={styles.cellPlanName}>
                {enrollment.planName}/{enrollment.tier}
              </div>
              <div className={styles.cellPremiumValue}>{formatCurrency(enrollment.premium)}</div>
            </div>
          );
        },
      }),
      columnHelper.accessor('recommendation', {
        header: 'Recommendation',
        size: 160,
        cell: (info) => {
          const rec = info.getValue();
          const enrollment = info.row.original;
          const approvedPolicyIds = enrollment.approvedPolicyIds ?? [];
          const notApprovedPolicyIds = enrollment.notApprovedPolicyIds ?? [];
          const hasSimilarPolicies =
            approvedPolicyIds.length > 0 || notApprovedPolicyIds.length > 0;
          return (
            <div className={styles.cellRecGroup}>
              <div className={styles.cellRecToggle}>
                <span
                  className={`${styles.recIndicator} ${rec === 'Yes' ? styles.recYes : styles.recNo}`}
                >
                  {rec}
                </span>
              </div>
              <button className={styles.cellLink} onClick={() => onViewMedicalDetails(enrollment)}>
                View Medical Details
              </button>
              {hasSimilarPolicies && (
                <div className={styles.similarSection}>
                  <span className={styles.similarTitle}>Similar Policies</span>
                  <div className={styles.similarBadges}>
                    {approvedPolicyIds.map((id) => (
                      <span
                        key={`approved-${id}`}
                        className={`${styles.similarBadge} ${styles.similarBadgeGreen}`}
                      >
                        {id}
                      </span>
                    ))}
                    {notApprovedPolicyIds.map((id) => (
                      <span
                        key={`not-approved-${id}`}
                        className={`${styles.similarBadge} ${styles.similarBadgeRed}`}
                      >
                        {id}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: 'ACTION',
        size: 120,
        cell: (info) => renderActions(info.row.original),
      }),
    ],
    [
      onOpenDrawer,
      onViewMedicalDetails,
      renderActions,
      isPendingSig,
      allSelected,
      selectedIds,
      toggleSelect,
      toggleSelectAll,
      openModal,
      T.indigo,
    ]
  );

  return (
    <div
      style={{
        background: T.bg,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Topbar
        title="Enrollment Cases"
        subtitle="L713 Medical Underwriting · All Enrollments"
        compactMobile
      />
      <div className={styles.mobileHeaderMeta}>
        <div className={styles.mobileHeaderTitle}>Enrollment Cases</div>
        <div className={styles.mobileHeaderSubtitle}>
          L713 Medical Underwriting · All Enrollments
        </div>
      </div>

      <div
        className={styles.pageWrapper}
        style={{ background: T.bg, flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}
      >
        {/* ─── Trapezoid Tabs ─── */}
        <div className={styles.tabsContainer}>
          {STATUS_FILTERS.map((sf) => {
            const isActive = filterStatus === sf;
            return (
              <button
                key={sf}
                onClick={() => setFilterStatus(sf as EnrollmentStatus | 'All' | 'Termed')}
                className={`${styles.tabPill} ${isActive ? styles.tabPillActive : ''}`}
              >
                <div className={styles.tabContent}>
                  {TAB_LABELS[sf] ?? sf}
                  <span
                    className={`${styles.tabCount} ${isActive ? styles.tabCountActive : styles.tabCountInactive}`}
                  >
                    {counts[sf] ?? 0}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* ─── Search Bar (outside table card) ─── */}
        <div className={styles.outerSearchBar}>
          <div className={styles.searchWrapper}>
            <HiOutlineSearch className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="Search by name, case ID, email, or plan..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ background: T.bgCard, color: T.text }}
            />
            {searchText && (
              <button
                className={styles.clearBtn}
                onClick={() => setSearchText('')}
                aria-label="Clear search"
              >
                <HiOutlineX />
              </button>
            )}
          </div>
        </div>

        {/* ─── Table Container Card ─── */}
        <div className={styles.tableCard} style={{ background: T.bgCard }}>
          <EnrollmentTable
            data={filtered}
            columns={columns}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            showTopPagination
            isLoading={isLoading || isSearching}
            emptyMessage={isLoading ? 'Loading enrollments…' : 'No enrollments match your filters.'}
          />
        </div>
      </div>

      {isPendingSig && selectedIds.size > 0 && (
        <div
          style={{
            flexShrink: 0,
            background: T.bgCard,
            borderTop: `1px solid ${T.border}`,
            padding: '12px 24px',
            display: 'flex',
            gap: 16,
            zIndex: 100,
          }}
          className={styles.bulkActionBar}
        >
          <div className={styles.bulktext}>
            <HiOutlineShieldCheck size={18} />
            <span style={{ fontWeight: 600, fontSize: 14 }}>
              {selectedIds.size} record{selectedIds.size > 1 ? 's' : ''} selected
            </span>
          </div>
          <div className={styles.bulkActions}>
            <button
              onClick={() => setSelectedIds(new Set())}
              style={{
                background: 'transparent',
                color: T.red,
                border: `1px solid ${T.red}`,
                borderRadius: 6,
                padding: '12px 16px',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Clear
            </button>
            <button
              onClick={handleBulkApprove}
              style={{
                background: T.indigo,
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '12px 16px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Bulk Approve
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
