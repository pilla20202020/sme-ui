import { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Topbar } from '@/layouts';
import { SkeletonLoader } from '@/shared/components/ui';
import { useTheme } from '@/app/providers/ThemeContext';
import { ROUTES } from '@/app/router/routeConfig';
import type { Enrollment } from '@/domains/enrollments/types';
import type { MedicalDetails } from '@/domains/enrollments/types/medicalDetails';
import {
  fetchMedicalDetails,
  mapMedicalDetailsResponse,
} from '@/domains/enrollments/api/medicalDetailsApi';
import styles from './MedicalDetailsPage.module.css';

const EMPTY_MEDICAL_DETAILS: Omit<MedicalDetails, 'loadState'> = {
  recommendation: {
    recommendation: [],
    description: '',
    justification: '',
    preExistingImpact: [],
    requiredServices: [],
  },
  riskSeverity: {
    riskAssessment: [],
    riskFactors: [],
    severity: [],
    severityJustification: '',
    treatmentDuration: '',
    treatmentDurationReasoning: '',
  },
  drugSummary: {
    associatedSymptoms: [],
    conditions: [],
    drugs: [],
    referenceSites: [],
    additionalInfo: [],
  },
  costEstimation: {
    costEstimation: [],
    costEstimationFactors: [],
    totalMonthlyCost: [],
  },
};

/* ─── Sub-components ────────────────────────────────────────────────────────── */
function badgeColorClass(item: string): string {
  if (item === 'Yes') return styles.similarBadgeGreen;
  if (item === 'Moderate') return styles.similarBadgeYellow;
  return styles.similarBadgeRed;
}

function BulletList({ items, badge }: { items: string[]; badge?: boolean }) {
  if (!items.length || (items.length === 1 && items[0] === 'No Data')) {
    return <p className={styles.noData}>No Data</p>;
  }
  return (
    <ul className={styles.bulletList}>
      {items.map((item, i) => (
        <li key={i}>
          {badge ? (
            <span className={`${styles.similarBadge} ${badgeColorClass(item)}`}>{item}</span>
          ) : (
            item
          )}
        </li>
      ))}
    </ul>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionLabel}>{label}</div>
      {children}
    </div>
  );
}

function ErrorPanel({ onRetry }: { onRetry: () => void }) {
  return (
    <div className={styles.errorPanel}>
      <p className="mb-0">Unable to load medical details. Please try again.</p>
      <button className={styles.retryBtn} onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}

/* ─── Page rows ──────────────────────────────────────────────────────────────── */
function RecommendationRow({ data }: { data: MedicalDetails['recommendation'] }) {
  return (
    <div className={styles.pageRow}>
      <h3 className={styles.rowTitle}>Medical Recommendation</h3>
      <div className={styles.twoCol}>
        <div className={styles.colLeft}>
          <Section label="Recommendation">
            <BulletList items={data.recommendation} badge />
          </Section>
          <Section label="Description">
            <p className={styles.bodyText}>{data.description}</p>
          </Section>
          <Section label="Justification">
            <p className={styles.bodyText}>{data.justification}</p>
          </Section>
          <Section label="Pre Existing Impact">
            <BulletList
              items={data.preExistingImpact.length ? data.preExistingImpact : ['No Data']}
            />
          </Section>
        </div>
        <div className={styles.colRight}>
          <Section label="Required Services">
            <BulletList items={data.requiredServices} />
          </Section>
        </div>
      </div>
    </div>
  );
}

function RiskRow({ data }: { data: MedicalDetails['riskSeverity'] }) {
  return (
    <div className={styles.pageRow}>
      <h3 className={styles.rowTitle}>Risk And Severity</h3>
      <div className={styles.twoCol}>
        <div className={styles.colLeft}>
          <Section label="Risk Assessment">
            <BulletList items={data.riskAssessment} badge />
          </Section>
        </div>
        <div className={styles.colRight}>
          <Section label="Risk Factors">
            <BulletList items={data.riskFactors} />
          </Section>
        </div>
      </div>
      <hr className={styles.divider} />
      <div className={styles.sectionwrapper}>
        <Section label="Severity">
          <BulletList items={data.severity} />
        </Section>
        <Section label="Severity Justification">
          <p className={styles.bodyText}>{data.severityJustification}</p>
        </Section>
        <Section label="Treatment Duration">
          <p className={styles.bodyText}>{data.treatmentDuration}</p>
        </Section>
        <Section label="Treatment Duration Reasoning">
          <p className={styles.bodyText}>{data.treatmentDurationReasoning}</p>
        </Section>
      </div>
    </div>
  );
}

function DrugsRow({ data }: { data: MedicalDetails['drugSummary'] }) {
  return (
    <div className={styles.pageRow}>
      <h3 className={styles.rowTitle}>Drugs and Medical Summary</h3>
      <div className={styles.sectionwrapper}>
        <div className={styles.twoCol}>
          <div className={styles.colLeft}>
            <Section label="Associated Symptoms">
              <BulletList items={data.associatedSymptoms} />
            </Section>
          </div>
          <div className={styles.colRight}>
            <Section label="Medical Condition / Diseases">
              <BulletList items={data.conditions} />
            </Section>
          </div>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.drugTable}>
            <thead>
              <tr>
                <th>Condition</th>
                <th>Dosage</th>
                <th>Drug Name</th>
                <th>Price</th>
                <th>Price Fluctuation</th>
                <th>Actual Monthly Cost</th>
              </tr>
            </thead>
            <tbody>
              {data.drugs.map((drug, i) => (
                <tr key={i}>
                  <td>{drug.condition}</td>
                  <td>{drug.dosage}</td>
                  <td>{drug.drugName}</td>
                  <td>{drug.price}</td>
                  <td>{drug.priceFluctuation}</td>
                  <td>{drug.actualMonthlyCost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Section label="Reference Site">
          <BulletList items={data.referenceSites} />
        </Section>
        <Section label="Additional Info">
          <BulletList items={data.additionalInfo} />
        </Section>
      </div>
    </div>
  );
}

function CostRow({ data }: { data: MedicalDetails['costEstimation'] }) {
  return (
    <div className={styles.pageRow}>
      <h3 className={styles.rowTitle}>Cost Estimation</h3>
      <div className={styles.threeCol}>
        <div>
          <Section label="Cost Estimation">
            <BulletList items={data.costEstimation} />
          </Section>
        </div>
        <div>
          <Section label="Cost Estimation Factors">
            <BulletList items={data.costEstimationFactors} />
          </Section>
        </div>
        <div>
          <Section label="Total Monthly Drug Cost">
            <BulletList items={data.totalMonthlyCost} />
          </Section>
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────────────── */
export function MedicalDetailsPage() {
  const { T } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { policyId } = useParams<{ policyId: string }>();
  const stateEnrollment = (location.state as { enrollment?: Enrollment } | null)?.enrollment;
  const [storedEnrollment] = useState<Enrollment | undefined>(() => {
    if (stateEnrollment || !policyId) return undefined;
    const raw = sessionStorage.getItem(`medicalDetails:${policyId}`);
    return raw ? (JSON.parse(raw) as Enrollment) : undefined;
  });
  const enrollment = stateEnrollment ?? storedEnrollment;

  const [details, setDetails] = useState<MedicalDetails | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!enrollment) {
      navigate(ROUTES.ENROLLMENTS, { replace: true });
      return;
    }
    const targetPolicyId = policyId ?? enrollment.policyId;
    const controller = new AbortController();

    setDetails({ ...EMPTY_MEDICAL_DETAILS, loadState: 'loading' });
    fetchMedicalDetails(targetPolicyId, controller.signal)
      .then((raw) => setDetails(mapMedicalDetailsResponse(raw)))
      .catch((err) => {
        if (controller.signal.aborted) return;
        console.error(err);
        setDetails({ ...EMPTY_MEDICAL_DETAILS, loadState: 'error' });
      });

    return () => controller.abort();
  }, [enrollment, policyId, navigate, reloadToken]);

  const handleRetry = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  if (!enrollment) return null;

  function renderContent() {
    if (!details || details.loadState === 'loading')
      return <SkeletonLoader blocks={4} linesPerBlock={2} />;
    if (details.loadState === 'error') return <ErrorPanel onRetry={handleRetry} />;

    return (
      <div className="row">
        <div className="col-lg-6 col-md-12 mb-3">
          <RecommendationRow data={details.recommendation} />
        </div>
        <div className="col-lg-6 col-md-12 mb-3">
          <RiskRow data={details.riskSeverity} />
        </div>
        <div className="col-md-12 mb-3">
          <DrugsRow data={details.drugSummary} />
        </div>
        <div className="col-md-12 mb-3">
          <CostRow data={details.costEstimation} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: T.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Topbar
        title="Medical Details"
        subtitle={`${enrollment.name} · ${policyId ?? enrollment.policyId}`}
        compactMobile
      />

      <div className={styles.page}>
        <div className={styles.contentPanel}>{renderContent()}</div>
      </div>
    </div>
  );
}
