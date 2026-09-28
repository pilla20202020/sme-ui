import { useEnrollments } from '../hooks/useEnrollments';
import { EnrollmentsPage } from './EnrollmentsPage';
import { EnrollmentDrawer } from '../components/EnrollmentDrawer';
import { EnrollmentModals } from '../components/EnrollmentModals';
import { EnrollmentActionsContainer } from '../components/EnrollmentActionsContainer';
import { ROUTES } from '@/app/router/routeConfig';
import type { Enrollment } from '../types';

interface Props {
  onNavigateDashboard: () => void;
}

export function EnrollmentsContainer({ onNavigateDashboard }: Props) {
  const { enrollments, counts, filters, drawer, isLoading, handleBulkApprove } = useEnrollments();

  const handleViewMedicalDetails = (enrollment: Enrollment) => {
    sessionStorage.setItem(`medicalDetails:${enrollment.policyId}`, JSON.stringify(enrollment));
    window.open(
      ROUTES.ENROLLMENT_MEDICAL_DETAILS.replace(':policyId', enrollment.policyId),
      '_blank'
    );
  };

  return (
    <>
      <EnrollmentsPage
        filtered={filters.filtered}
        counts={counts}
        filterStatus={filters.filterStatus}
        setFilterStatus={filters.setFilterStatus}
        searchText={filters.searchText}
        setSearchText={filters.setSearchText}
        carrierFilter={filters.carrierFilter}
        setCarrierFilter={filters.setCarrierFilter}
        sortCol={filters.sortCol}
        sortDir={filters.sortDir}
        handleSort={filters.handleSort}
        onNavigateDashboard={onNavigateDashboard}
        renderActions={(e) => <EnrollmentActionsContainer enrollment={e} />}
        onOpenDrawer={drawer.openDrawer}
        onViewMedicalDetails={handleViewMedicalDetails}
        onBulkApprove={handleBulkApprove}
        isLoading={isLoading}
      />

      {drawer.drawerOpen && drawer.drawerCase && (
        <EnrollmentDrawer
          enrollment={
            enrollments.find((e) => e.key === drawer.drawerCase!.key) ?? drawer.drawerCase
          }
          drawerTab={drawer.drawerTab}
          setDrawerTab={drawer.setDrawerTab}
          onClose={drawer.closeDrawer}
        />
      )}

      <EnrollmentModals />
    </>
  );
}
