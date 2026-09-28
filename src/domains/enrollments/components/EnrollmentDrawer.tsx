import { useState, useEffect } from 'react';
import {
  HiOutlineDocumentText,
  HiOutlineUser,
  HiOutlinePhone,
  HiOutlineBriefcase,
  HiOutlineCreditCard,
  HiOutlineClipboardList,
  HiOutlineUsers,
  HiOutlineGlobeAlt,
  HiOutlineDownload,
  HiX,
} from 'react-icons/hi';
import { useTheme } from '@/app/providers/ThemeContext';
import { StatusBadge } from '@/shared/components/ui';
import { formatDate } from '@/shared/utils';
import type { Enrollment } from '@/domains/enrollments/types';
import drawerStyles from './EnrollmentDrawer.module.css';
import { usePolicyReport } from '../hooks';
import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable';

/* Constants */
const FONT = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

/* Types */
interface EnrollmentDrawerProps {
  enrollment: Enrollment;
  drawerTab?: string;
  setDrawerTab?: (tabId: string) => void;
  onClose: () => void;
  policyReport?: ReturnType<typeof usePolicyReport>;
}

type TabKey =
  | 'policy'
  | 'primary'
  | 'contact'
  | 'agent'
  | 'payment'
  | 'phq'
  | 'dependents'
  | 'browser';

/* Helpers */
function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/**
 * The API echoes the single "additional notes" field submitted at the end of a
 * questionnaire onto every question row, so a naive join produces the same
 * text once per question. Dedupe down to the one distinct value it represents.
 */
function getUniqueNote(items: Array<{ additionalNotes: string | null }>): string {
  const notes = [...new Set(items.map((i) => i.additionalNotes?.trim()).filter(Boolean))];
  return notes.join(' ');
}

/** The API embeds formatting tags (e.g. "<B>...</B>") in question text meant for its own HTML rendering. */
function cleanText(text: string): string {
  return text.replace(/<[^>]*>/g, '');
}

interface PhqQuestionForPdf {
  question: string;
  selectedAnswer: string;
  medMedications: Array<{
    medication: string | null;
    dosage: string | null;
    medicalCondition: string | null;
  }>;
  medConditions: Array<{
    healthCondition: string | null;
    dateOfOnset: string | null;
    dateOfRecovery: string | null;
    isTreatment: boolean;
    isMedicate: boolean;
    dLastSeen: string | null;
    symptoms: string | null;
  }>;
}

function renderPhqQuestionsPdf(
  doc: jsPDF,
  questions: PhqQuestionForPdf[],
  startY: number,
  marginX: number
): number {
  const getY = () =>
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? startY;

  let currentY = startY;
  questions.forEach((q, i) => {
    const isYes = q.selectedAnswer === '1';

    autoTable(doc, {
      startY: currentY,
      showHead: i === 0 ? 'firstPage' : 'never',
      head: [['No.', 'Question', 'Answer']],
      body: [[`Q${i + 1}`, cleanText(q.question), isYes ? 'Yes' : 'No']],
      margin: { left: marginX, right: marginX },
      styles: { fontSize: 9, cellPadding: 2.5, valign: 'top', textColor: [17, 24, 39] },
      headStyles: { fillColor: [249, 250, 251], textColor: [107, 114, 128], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 14, textColor: [156, 163, 175], fontStyle: 'bold' },
        2: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      },
    });
    currentY = getY();

    if (isYes && q.medMedications.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(99, 102, 241);
      doc.text('Medications', marginX + 14, currentY + 5);

      autoTable(doc, {
        startY: currentY + 7,
        head: [['Medication', 'Dosage', 'Medical Condition']],
        body: q.medMedications.map((m) => [
          m.medication ?? '',
          m.dosage ?? '',
          m.medicalCondition ?? '',
        ]),
        margin: { left: marginX + 14, right: marginX },
        styles: { fontSize: 8, cellPadding: 2, textColor: [17, 24, 39] },
        headStyles: { fillColor: [238, 242, 255], textColor: [99, 102, 241], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [249, 250, 251] },
      });
      currentY = getY();
    }

    if (isYes && q.medConditions.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(99, 102, 241);
      doc.text('Health Conditions', marginX + 14, currentY + 5);

      autoTable(doc, {
        startY: currentY + 7,
        head: [
          ['Condition', 'Onset', 'Recovery', 'Treatment', 'Medicated', 'Last Seen', 'Symptoms'],
        ],
        body: q.medConditions.map((c) => [
          c.healthCondition ?? '',
          c.dateOfOnset ?? '',
          c.dateOfRecovery ?? '',
          c.isTreatment ? 'Yes' : 'No',
          c.isMedicate ? 'Yes' : 'No',
          c.dLastSeen ?? '',
          c.symptoms ?? '',
        ]),
        margin: { left: marginX + 14, right: marginX },
        styles: { fontSize: 7.5, cellPadding: 2, textColor: [17, 24, 39] },
        headStyles: { fillColor: [238, 242, 255], textColor: [99, 102, 241], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [249, 250, 251] },
      });
      currentY = getY() + 4;
    }
  });

  return currentY;
}

/** Renders the single de-duped additional-notes value at the end of a person's PHQ section. */
function renderAdditionalNotesPdf(
  doc: jsPDF,
  note: string,
  startY: number,
  marginX: number
): number {
  if (!note) return startY;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(107, 114, 128);
  doc.text('ADDITIONAL NOTES', marginX, startY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(17, 24, 39);
  const lines = doc.splitTextToSize(note, 180) as string[];
  doc.text(lines, marginX, startY + 13);

  return startY + 13 + lines.length * 4.2;
}

/* InfoRow */
function InfoRow({
  label,
  value,
  mono = false,
  T,
  wide = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  T: ReturnType<typeof useTheme>['T'];
  wide?: boolean;
}) {
  void mono;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        gridColumn: wide ? 'span 2' : undefined,
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.55px',
          color: T.textMuted,
          fontFamily: FONT,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: T.text,
          fontFamily: FONT,
          lineHeight: 1.4,
        }}
      >
        {value || '—'}
      </span>
    </div>
  );
}

/* TabsNav */
function TabsNav({
  tabs,
  activeTab,
  onChange,
  T,
}: {
  tabs: { key: TabKey; label: string; icon: React.ReactNode; badge?: React.ReactNode }[];
  activeTab: TabKey;
  onChange: (key: TabKey) => void;
  T: ReturnType<typeof useTheme>['T'];
}) {
  return (
    <div className={drawerStyles.tabsNav}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <button
            key={tab.key}
            type="button"
            className={`${drawerStyles.tabBtn} ${isActive ? drawerStyles.tabBtnActive : ''}`}
            onClick={() => onChange(tab.key)}
            style={{
              color: isActive ? T.indigo : T.textMuted,
              background: isActive ? T.indigoDim : 'transparent',
              borderColor: isActive ? T.indigo : T.border,
            }}
          >
            <span className={drawerStyles.tabBtnIcon}>{tab.icon}</span>
            {tab.label}
            {tab.badge}
          </button>
        );
      })}
    </div>
  );
}

/* Main Component */
export function EnrollmentDrawer({ enrollment, onClose }: EnrollmentDrawerProps) {
  const { T } = useTheme();
  const policyReport = usePolicyReport(enrollment.policyId);
  const report = policyReport.data;
  const [activeTab, setActiveTab] = useState<TabKey>('policy');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  function downloadPHQPdf() {
    const name = report?.primary.fullname ?? '';
    const policyId = report?.policy.policyId ?? '';
    const planName = report?.policy.planName ?? '';
    const filename = `PHQ Report - ${name} - Policy #${policyId}.pdf`;

    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const marginX = 14;

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(17, 24, 39);
    doc.text('Personal Health Questionnaire', marginX, 18);

    // Meta line
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text(`Member: ${name}     Policy: ${policyId}     Plan: ${planName}`, marginX, 25);

    const questionnaire = report?.questionnaire ?? [];
    let currentY = renderPhqQuestionsPdf(doc, questionnaire, 30, marginX);
    currentY = renderAdditionalNotesPdf(doc, getUniqueNote(questionnaire), currentY, marginX);

    for (const dep of report?.dependents ?? []) {
      if (dep.healthAnswers.length === 0) continue;

      doc.addPage();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(17, 24, 39);
      doc.text(`Dependent: ${dep.fullname} (${dep.relationship})`, marginX, 18);

      currentY = renderPhqQuestionsPdf(doc, dep.healthAnswers, 26, marginX);
      currentY = renderAdditionalNotesPdf(doc, getUniqueNote(dep.healthAnswers), currentY, marginX);
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, marginX, currentY + 8);

    doc.save(filename);
  }

  const phqAnswers = report?.questionnaire
    ? report.questionnaire.map((q) => ({
        question: q.question,
        answer: q.selectedAnswer === '1' || q.selectedAnswer.toLowerCase() === 'yes' ? 'Yes' : 'No',
        detail: q.additionalNotes ?? '',
        medications: q.medMedications,
        conditions: q.medConditions,
      }))
    : [];

  const yesCount = phqAnswers.filter((a) => a.answer === 'Yes').length;
  const displayDependents = report?.dependents ?? [];
  const primaryNote = getUniqueNote(report?.questionnaire ?? []);

  function CountBadge({ count }: { count: number }) {
    if (count <= 0) return null;
    return (
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          padding: '1px 7px',
          borderRadius: 100,
          background: T.indigo,
          color: '#fff',
          marginLeft: 2,
        }}
      >
        {count}
      </span>
    );
  }

  const TABS: { key: TabKey; label: string; icon: React.ReactNode; badge?: React.ReactNode }[] = [
    {
      key: 'policy',
      label: 'Policy Details',
      icon: <HiOutlineDocumentText size={14} />,
    },
    {
      key: 'primary',
      label: 'Primary Info',
      icon: <HiOutlineUser size={14} />,
    },
    {
      key: 'contact',
      label: 'Contact',
      icon: <HiOutlinePhone size={14} />,
    },
    {
      key: 'agent',
      label: 'Agent',
      icon: <HiOutlineBriefcase size={14} />,
    },
    {
      key: 'payment',
      label: 'Payment',
      icon: <HiOutlineCreditCard size={14} />,
    },
    {
      key: 'phq',
      label: 'Health Questionnaire',
      icon: <HiOutlineClipboardList size={14} />,
      badge: <CountBadge count={yesCount} />,
    },
    {
      key: 'dependents',
      label: 'Dependents',
      icon: <HiOutlineUsers size={14} />,
      badge: <CountBadge count={displayDependents.length} />,
    },
    {
      key: 'browser',
      label: 'Device Info',
      icon: <HiOutlineGlobeAlt size={14} />,
    },
  ];

  return (
    <>
      {/* Overlay */}
      <div className={drawerStyles.overlay} onClick={onClose} />

      {/* Drawer */}
      <div className={drawerStyles.drawer} style={{ background: T.bgCard, fontFamily: FONT }}>
        {/* Header */}
        <div className={drawerStyles.header} style={{ padding: '14px 22px', background: T.bgAlt }}>
          <div className={drawerStyles.headerInner}>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                minWidth: 0,
                flex: 1,
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 12,
                  flexShrink: 0,
                  background: T.indigo,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 700,
                  letterSpacing: '-0.5px',
                }}
              >
                {getInitials(report?.primary.fullname ?? '')}
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: T.text,
                    letterSpacing: '-0.3px',
                    marginBottom: 6,
                  }}
                >
                  {report?.primary.fullname ?? '—'}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: FONT,
                      color: T.textMuted,
                      background: T.bgHover,
                      padding: '2px 7px',
                      borderRadius: 5,
                      fontWeight: 600,
                    }}
                  >
                    {report?.policy.policyId ?? '—'}
                  </span>
                  <StatusBadge status={enrollment.status} />
                </div>
              </div>
            </div>
            <button className={drawerStyles.closeBtn} onClick={onClose} aria-label="Close">
              <HiX />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={drawerStyles.content} style={{ padding: '20px 22px', fontFamily: FONT }}>
          <div>
            {/* Quick info strip */}
            {/* <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '6px 20px',
                marginBottom: 20,
              }}
            >
              {[
                {
                  icon: <HiOutlineMail size={13} />,
                  value: report?.contact.email ?? '—',
                  sub: 'Email',
                },
                {
                  icon: <HiOutlinePhone size={13} />,
                  value: report?.contact.phone ?? '—',
                  sub: 'Phone',
                },
                {
                  icon: <HiOutlineDocumentText size={13} />,
                  value: report?.policy.planName ?? '—',
                  sub: 'Plan',
                },
                {
                  icon: <HiOutlineBriefcase size={13} />,
                  value: report?.agent.fullname ?? '—',
                  sub: 'Agent',
                },
              ].map((f) => (
                <div key={f.sub} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      color: T.textMuted,
                      flexShrink: 0,
                      display: 'flex',
                    }}
                  >
                    {f.icon}
                  </span>
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        color: T.text,
                        fontWeight: 500,
                        fontFamily: FONT,
                      }}
                    >
                      {f.value}
                    </div>
                    <div
                      style={{
                        fontSize: 10.5,
                        color: T.textMuted,
                        fontFamily: FONT,
                      }}
                    >
                      {f.sub}
                    </div>
                  </div>
                </div>
              ))}
            </div> */}

            {/* Divider */}
            {/* <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                margin: '24px 0 16px',
              }}
            >
              <div style={{ flex: 1, height: 1, background: T.border }} />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.7px',
                  color: T.textMuted,
                }}
              >
                Enrollment Report
              </span>
              <div style={{ flex: 1, height: 1, background: T.border }} />
            </div> */}

            {/* Tabs */}
            <div className={drawerStyles.tabsLayout}>
              <TabsNav tabs={TABS} activeTab={activeTab} onChange={setActiveTab} T={T} />

              <div
                className={drawerStyles.tabPanel}
                style={{
                  borderRadius: 12,
                  border: '1px solid ' + T.border,
                  background: T.bgCard,
                  boxShadow: T.shadow,
                  padding: '16px 16px 18px',
                }}
              >
                {/* Policy Details */}
                {activeTab === 'policy' && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 14,
                    }}
                  >
                    <InfoRow label="Policy ID" value={report?.policy.policyId ?? '—'} mono T={T} />
                    <InfoRow
                      label="Policy Name"
                      value={
                        report ? `${report.policy.planName}/${report.policy.healthPlanTier}` : '—'
                      }
                      T={T}
                    />
                    <InfoRow
                      label="Enrollment Date"
                      value={
                        report?.policy.enrollmentDate
                          ? formatDate(report.policy.enrollmentDate)
                          : '—'
                      }
                      mono
                      T={T}
                    />
                    <InfoRow
                      label="Effective Date"
                      value={
                        report?.policy.effectiveDate
                          ? formatDate(report.policy.effectiveDate)
                          : 'TBD'
                      }
                      mono
                      T={T}
                    />
                  </div>
                )}

                {/* Primary Information */}
                {activeTab === 'primary' && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 14,
                    }}
                  >
                    <InfoRow label="User ID" value={report?.primary.id ?? '—'} mono T={T} />
                    <InfoRow label="Full Name" value={report?.primary.fullname ?? '—'} T={T} />
                    <InfoRow label="Gender" value={report?.primary.gender ?? '—'} T={T} />
                    <InfoRow
                      label="Date of Birth"
                      value={report?.primary.dob ? formatDate(report.primary.dob) : '—'}
                      mono
                      T={T}
                    />
                    <InfoRow
                      label="Height"
                      value={
                        report?.primary.heightFeet || report?.primary.heightInches
                          ? `${report.primary.heightFeet}' ${report.primary.heightInches}"`
                          : '—'
                      }
                      T={T}
                    />
                    <InfoRow
                      label="Weight"
                      value={report?.primary.weightLbs ? `${report.primary.weightLbs} lbs` : '—'}
                      T={T}
                    />
                    <InfoRow label="SSN" value={report?.primary.maskedSsn ?? '—'} mono T={T} />
                    <InfoRow
                      label="Sign Up Date"
                      value={
                        report?.primary.signUpDate ? formatDate(report.primary.signUpDate) : '—'
                      }
                      mono
                      T={T}
                    />
                  </div>
                )}

                {/* Contact Information */}
                {activeTab === 'contact' && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 14,
                    }}
                  >
                    <InfoRow label="Email" value={report?.contact.email ?? '—'} mono T={T} />
                    <InfoRow label="Phone" value={report?.contact.phone ?? '—'} mono T={T} />
                    <InfoRow
                      label="Address"
                      value={
                        report?.contact.address1
                          ? [
                              report.contact.address1,
                              report.contact.address2,
                              report.contact.city,
                              report.contact.state,
                              report.contact.zip,
                            ]
                              .filter(Boolean)
                              .join(', ')
                          : '—'
                      }
                      T={T}
                      wide
                    />
                  </div>
                )}

                {/* Agent Information */}
                {activeTab === 'agent' && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 14,
                    }}
                  >
                    <InfoRow
                      label="Agent Name"
                      value={
                        report?.agent.fullname
                          ? `${report.agent.fullname} (${report.agent.id})`
                          : `${enrollment.agentName} (${enrollment.agentId})`
                      }
                      T={T}
                    />
                    <InfoRow
                      label="Rep Code"
                      value={report?.agent.code ?? enrollment.agentRepCode}
                      mono
                      T={T}
                    />
                  </div>
                )}

                {/* Payment Information */}
                {activeTab === 'payment' && (
                  <div className={drawerStyles.paymentGrid}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.55px',
                          color: T.textMuted,
                        }}
                      >
                        Payment Method
                      </span>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          marginTop: 2,
                          padding: '10px 12px',
                          borderRadius: 8,
                          border: '1px solid ' + T.border,
                          background: T.bgAlt,
                        }}
                      >
                        <div
                          style={{
                            width: 34,
                            height: 24,
                            borderRadius: 5,
                            background: T.indigoDim,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <HiOutlineClipboardList size={14} color={T.indigo} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>
                            {report?.payment.paymentMethod}
                          </div>
                          <div style={{ fontSize: 11, color: T.textMuted }}>
                            {report?.payment.paymentBankName}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.55px',
                          color: T.textMuted,
                        }}
                      >
                        Recurring Method
                      </span>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          marginTop: 2,
                          padding: '10px 12px',
                          borderRadius: 8,
                          border: '1px solid ' + T.border,
                          background: T.bgAlt,
                        }}
                      >
                        <div
                          style={{
                            width: 34,
                            height: 24,
                            borderRadius: 5,
                            background: T.indigoDim,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <HiOutlineClipboardList size={14} color={T.indigo} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>
                            {report?.payment.recurringMethod}
                          </div>
                          <div style={{ fontSize: 11, color: T.textMuted }}>
                            {report?.payment.recurringBankName}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Personal Health Questionnaire */}
                {activeTab === 'phq' && (
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        marginBottom: 12,
                      }}
                    >
                      <button
                        onClick={downloadPHQPdf}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '5px 11px',
                          borderRadius: 7,
                          border: '1px solid ' + T.border,
                          background: T.bgCard,
                          color: T.indigo,
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: FONT,
                        }}
                      >
                        <HiOutlineDownload size={12} /> Download PDF
                      </button>
                    </div>
                    <div
                      style={{
                        borderRadius: 8,
                        border: '1px solid ' + T.borderLight,
                        overflow: 'hidden',
                      }}
                    >
                      {phqAnswers.map((qa, i) => {
                        const isYes = qa.answer === 'Yes';
                        const hasMeds = isYes && qa.medications.length > 0;
                        const hasConds = isYes && qa.conditions.length > 0;
                        return (
                          <div
                            key={i}
                            style={{
                              borderBottom:
                                i < phqAnswers.length - 1 ? '1px solid ' + T.borderLight : 'none',
                              background: i % 2 === 0 ? T.bgCard : T.bgAlt,
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                gap: 10,
                                padding: '9px 12px',
                                alignItems: 'flex-start',
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  fontFamily: FONT,
                                  color: T.textMuted,
                                  minWidth: 22,
                                  paddingTop: 2,
                                  flexShrink: 0,
                                }}
                              >
                                Q{i + 1}
                              </span>
                              <div style={{ flex: 1 }}>
                                <div
                                  style={{
                                    fontSize: 12.5,
                                    color: T.text,
                                    lineHeight: 1.4,
                                  }}
                                >
                                  {cleanText(qa.question)}
                                </div>
                              </div>
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: '2px 9px',
                                  borderRadius: 5,
                                  flexShrink: 0,
                                  marginTop: 1,
                                  fontFamily: FONT,
                                  background: isYes ? T.indigoDim : T.bgHover,
                                  color: isYes ? T.indigo : T.textMuted,
                                  border: '1px solid ' + T.border,
                                }}
                              >
                                {qa.answer}
                              </span>
                            </div>
                            {(hasMeds || hasConds) && (
                              <div
                                style={{
                                  padding: '0 12px 10px 44px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 8,
                                }}
                              >
                                {hasMeds && (
                                  <div>
                                    <div
                                      style={{
                                        fontSize: 10,
                                        fontWeight: 700,
                                        color: T.textMuted,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        marginBottom: 4,
                                        fontFamily: FONT,
                                      }}
                                    >
                                      Medications
                                    </div>
                                    <table
                                      style={{
                                        width: '100%',
                                        borderCollapse: 'collapse',
                                        fontSize: 11,
                                      }}
                                    >
                                      <thead>
                                        <tr style={{ background: T.bgAlt }}>
                                          {(
                                            ['Medication', 'Dosage', 'Medical Condition'] as const
                                          ).map((h) => (
                                            <th
                                              key={h}
                                              style={{
                                                padding: '4px 8px',
                                                textAlign: 'left',
                                                color: T.textMuted,
                                                fontWeight: 600,
                                                borderBottom: '1px solid ' + T.borderLight,
                                                fontFamily: FONT,
                                              }}
                                            >
                                              {h}
                                            </th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {qa.medications.map((med, mi) => (
                                          <tr
                                            key={mi}
                                            style={{
                                              background: mi % 2 === 0 ? T.bgCard : T.bgAlt,
                                            }}
                                          >
                                            <td
                                              style={{
                                                padding: '4px 8px',
                                                color: T.text,
                                                fontFamily: FONT,
                                              }}
                                            >
                                              {med.medication}
                                            </td>
                                            <td
                                              style={{
                                                padding: '4px 8px',
                                                color: T.text,
                                                fontFamily: FONT,
                                              }}
                                            >
                                              {med.dosage}
                                            </td>
                                            <td
                                              style={{
                                                padding: '4px 8px',
                                                color: T.text,
                                                fontFamily: FONT,
                                              }}
                                            >
                                              {med.medicalCondition}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                                {hasConds && (
                                  <div>
                                    <div
                                      style={{
                                        fontSize: 10,
                                        fontWeight: 700,
                                        color: T.textMuted,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        marginBottom: 4,
                                        fontFamily: FONT,
                                      }}
                                    >
                                      Health Conditions
                                    </div>
                                    <div className="table-responsive">
                                      <table
                                        style={{
                                          width: '100%',
                                          borderCollapse: 'collapse',
                                          fontSize: 11,
                                        }}
                                      >
                                        <thead>
                                          <tr style={{ background: T.bgAlt }}>
                                            {(
                                              [
                                                'Condition',
                                                'Date of Onset',
                                                'Date of Recovery',
                                                'On Treatment',
                                                'Medicated',
                                                'Last Seen',
                                                'Symptoms',
                                              ] as const
                                            ).map((h) => (
                                              <th
                                                key={h}
                                                style={{
                                                  padding: '4px 8px',
                                                  textAlign: 'left',
                                                  color: T.textMuted,
                                                  fontWeight: 600,
                                                  borderBottom: '1px solid ' + T.borderLight,
                                                  fontFamily: FONT,
                                                }}
                                              >
                                                {h}
                                              </th>
                                            ))}
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {qa.conditions.map((cond, ci) => (
                                            <tr
                                              key={ci}
                                              style={{
                                                background: ci % 2 === 0 ? T.bgCard : T.bgAlt,
                                              }}
                                            >
                                              <td
                                                style={{
                                                  padding: '4px 8px',
                                                  color: T.text,
                                                  fontFamily: FONT,
                                                }}
                                              >
                                                {cond.healthCondition}
                                              </td>
                                              <td
                                                style={{
                                                  padding: '4px 8px',
                                                  color: T.text,
                                                  fontFamily: FONT,
                                                }}
                                              >
                                                {cond.dateOfOnset ?? '—'}
                                              </td>
                                              <td
                                                style={{
                                                  padding: '4px 8px',
                                                  color: T.text,
                                                  fontFamily: FONT,
                                                }}
                                              >
                                                {cond.dateOfRecovery ?? '—'}
                                              </td>
                                              <td
                                                style={{
                                                  padding: '4px 8px',
                                                  color: T.text,
                                                  fontFamily: FONT,
                                                }}
                                              >
                                                {cond.isTreatment ? 'Yes' : 'No'}
                                              </td>
                                              <td
                                                style={{
                                                  padding: '4px 8px',
                                                  color: T.text,
                                                  fontFamily: FONT,
                                                }}
                                              >
                                                {cond.isMedicate ? 'Yes' : 'No'}
                                              </td>
                                              <td
                                                style={{
                                                  padding: '4px 8px',
                                                  color: T.text,
                                                  fontFamily: FONT,
                                                }}
                                              >
                                                {cond.dLastSeen ?? '—'}
                                              </td>
                                              <td
                                                style={{
                                                  padding: '4px 8px',
                                                  color: T.text,
                                                  fontFamily: FONT,
                                                }}
                                              >
                                                {cond.symptoms ?? '—'}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {primaryNote && (
                      <div
                        style={{
                          marginTop: 12,
                          borderRadius: 8,
                          border: '1px solid ' + T.borderLight,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            padding: '8px 12px',
                            background: T.bgAlt,
                            borderBottom: '1px solid ' + T.borderLight,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 7,
                          }}
                        >
                          <HiOutlineClipboardList size={13} color={T.textMuted} />
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: T.textMuted,
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              fontFamily: FONT,
                            }}
                          >
                            Additional Notes
                          </span>
                        </div>
                        <div style={{ padding: '12px 14px', background: T.bgCard }}>
                          <p
                            style={{
                              fontSize: 12.5,
                              color: T.text,
                              fontWeight: 400,
                              lineHeight: 1.6,
                              fontFamily: FONT,
                              margin: 0,
                            }}
                          >
                            {primaryNote}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Dependents */}
                {activeTab === 'dependents' &&
                  (displayDependents.length === 0 ? (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '24px 0',
                        color: T.textMuted,
                        fontSize: 13,
                      }}
                    >
                      No dependents listed on this enrollment.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {displayDependents.map((dep, idx) => {
                        const depName = 'fullname' in dep ? dep.fullname : 'remvoe this';
                        const depInitials = depName
                          .split(' ')
                          .map((n: string) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase();
                        const avatarGrads = [
                          'linear-gradient(135deg,#10b981,#059669)',
                          'linear-gradient(135deg,#f59e0b,#d97706)',
                          'linear-gradient(135deg,#8b5cf6,#6366f1)',
                          'linear-gradient(135deg,#0ea5e9,#0284c7)',
                        ];
                        const depNote = getUniqueNote(dep.healthAnswers);
                        return (
                          <div
                            key={idx}
                            style={{
                              borderRadius: 10,
                              border: '1px solid ' + T.border,
                              background: T.bgCard,
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: '12px 16px',
                                background: T.bgAlt,
                                borderBottom: '1px solid ' + T.border,
                              }}
                            >
                              <div
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 9,
                                  flexShrink: 0,
                                  background: avatarGrads[idx % avatarGrads.length],
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#fff',
                                  fontSize: 13,
                                  fontWeight: 700,
                                }}
                              >
                                {depInitials}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div
                                  style={{
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: T.text,
                                  }}
                                >
                                  {depName}
                                </div>
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: T.textMuted,
                                    marginTop: 1,
                                  }}
                                >
                                  {dep.relationship}
                                </div>
                              </div>
                            </div>
                            <div style={{ padding: '14px 16px' }}>
                              <div
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(3,1fr)',
                                  gap: 14,
                                  marginBottom: 14,
                                }}
                              >
                                <InfoRow label="Gender" value={dep.gender} T={T} />
                                <InfoRow
                                  label="Date of Birth"
                                  value={formatDate(dep.dob)}
                                  mono
                                  T={T}
                                />
                                <InfoRow label="Relationship" value={dep.relationship} T={T} />
                                <InfoRow label="SSN" value={dep.ssn} T={T} />
                              </div>
                              <div
                                style={{
                                  borderRadius: 8,
                                  border: '1px solid ' + T.borderLight,
                                  overflow: 'hidden',
                                }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 7,
                                    padding: '9px 12px',
                                    background: T.bgAlt,
                                    borderBottom: '1px solid ' + T.borderLight,
                                  }}
                                >
                                  <HiOutlineClipboardList size={13} color={T.textMuted} />
                                  <span
                                    style={{
                                      fontSize: 11,
                                      fontWeight: 700,
                                      color: T.textMuted,
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.5px',
                                    }}
                                  >
                                    Health Questionnaire
                                  </span>
                                </div>
                                <div
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 0,
                                  }}
                                >
                                  {(() => {
                                    const dependentQas = dep.healthAnswers.map((q) => ({
                                      question: q.question,
                                      answer:
                                        q.selectedAnswer === '1' ||
                                        q.selectedAnswer.toLowerCase() === 'yes'
                                          ? 'Yes'
                                          : 'No',
                                      detail: q.additionalNotes ?? '',
                                      medications: q.medMedications,
                                      conditions: q.medConditions,
                                    }));

                                    if (dependentQas.length === 0) {
                                      return (
                                        <div style={{ padding: '12px', color: T.textMuted }}>
                                          No questionnaire responses for this dependent.
                                        </div>
                                      );
                                    }

                                    return dependentQas.map((qa, qi) => {
                                      const isYes = qa.answer === 'Yes';
                                      const hasMeds = isYes && qa.medications.length > 0;
                                      const hasConds = isYes && qa.conditions.length > 0;
                                      return (
                                        <div
                                          key={qi}
                                          style={{
                                            borderBottom:
                                              qi < dependentQas.length - 1
                                                ? '1px solid ' + T.borderLight
                                                : 'none',
                                            background: qi % 2 === 0 ? T.bgCard : T.bgAlt,
                                          }}
                                        >
                                          <div
                                            style={{
                                              display: 'flex',
                                              gap: 10,
                                              padding: '8px 12px',
                                              alignItems: 'flex-start',
                                            }}
                                          >
                                            <span
                                              style={{
                                                fontSize: 10,
                                                fontWeight: 700,
                                                fontFamily: 'monospace',
                                                color: T.textMuted,
                                                minWidth: 22,
                                                paddingTop: 2,
                                                flexShrink: 0,
                                              }}
                                            >
                                              Q{qi + 1}
                                            </span>
                                            <div style={{ flex: 1 }}>
                                              <div
                                                style={{
                                                  fontSize: 12,
                                                  color: T.text,
                                                  lineHeight: 1.4,
                                                }}
                                              >
                                                {cleanText(qa.question)}
                                              </div>
                                            </div>
                                            <span
                                              style={{
                                                fontSize: 11,
                                                fontWeight: 700,
                                                padding: '2px 9px',
                                                borderRadius: 5,
                                                flexShrink: 0,
                                                marginTop: 1,
                                                fontFamily: FONT,
                                                background: isYes ? T.indigoDim : T.bgHover,
                                                color: isYes ? T.indigo : T.textMuted,
                                                border: '1px solid ' + T.border,
                                              }}
                                            >
                                              {qa.answer}
                                            </span>
                                          </div>
                                          {(hasMeds || hasConds) && (
                                            <div
                                              style={{
                                                padding: '0 12px 10px 44px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: 8,
                                              }}
                                            >
                                              {hasMeds && (
                                                <div>
                                                  <div
                                                    style={{
                                                      fontSize: 10,
                                                      fontWeight: 700,
                                                      color: T.textMuted,
                                                      textTransform: 'uppercase',
                                                      letterSpacing: '0.5px',
                                                      marginBottom: 4,
                                                      fontFamily: FONT,
                                                    }}
                                                  >
                                                    Medications
                                                  </div>
                                                  <table
                                                    style={{
                                                      width: '100%',
                                                      borderCollapse: 'collapse',
                                                      fontSize: 11,
                                                    }}
                                                  >
                                                    <thead>
                                                      <tr style={{ background: T.bgAlt }}>
                                                        {(
                                                          [
                                                            'Medication',
                                                            'Dosage',
                                                            'Medical Condition',
                                                          ] as const
                                                        ).map((h) => (
                                                          <th
                                                            key={h}
                                                            style={{
                                                              padding: '4px 8px',
                                                              textAlign: 'left',
                                                              color: T.textMuted,
                                                              fontWeight: 600,
                                                              borderBottom:
                                                                '1px solid ' + T.borderLight,
                                                              fontFamily: FONT,
                                                            }}
                                                          >
                                                            {h}
                                                          </th>
                                                        ))}
                                                      </tr>
                                                    </thead>
                                                    <tbody>
                                                      {qa.medications.map((med, mi) => (
                                                        <tr
                                                          key={mi}
                                                          style={{
                                                            background:
                                                              mi % 2 === 0 ? T.bgCard : T.bgAlt,
                                                          }}
                                                        >
                                                          <td
                                                            style={{
                                                              padding: '4px 8px',
                                                              color: T.text,
                                                              fontFamily: FONT,
                                                            }}
                                                          >
                                                            {med.medication}
                                                          </td>
                                                          <td
                                                            style={{
                                                              padding: '4px 8px',
                                                              color: T.text,
                                                              fontFamily: FONT,
                                                            }}
                                                          >
                                                            {med.dosage}
                                                          </td>
                                                          <td
                                                            style={{
                                                              padding: '4px 8px',
                                                              color: T.text,
                                                              fontFamily: FONT,
                                                            }}
                                                          >
                                                            {med.medicalCondition}
                                                          </td>
                                                        </tr>
                                                      ))}
                                                    </tbody>
                                                  </table>
                                                </div>
                                              )}
                                              {hasConds && (
                                                <div>
                                                  <div
                                                    style={{
                                                      fontSize: 10,
                                                      fontWeight: 700,
                                                      color: T.textMuted,
                                                      textTransform: 'uppercase',
                                                      letterSpacing: '0.5px',
                                                      marginBottom: 4,
                                                      fontFamily: FONT,
                                                    }}
                                                  >
                                                    Health Conditions
                                                  </div>
                                                  <table
                                                    style={{
                                                      width: '100%',
                                                      borderCollapse: 'collapse',
                                                      fontSize: 11,
                                                    }}
                                                  >
                                                    <thead>
                                                      <tr style={{ background: T.bgAlt }}>
                                                        {(
                                                          [
                                                            'Condition',
                                                            'Date of Onset',
                                                            'Date of Recovery',
                                                            'On Treatment',
                                                            'Medicated',
                                                            'Last Seen',
                                                            'Symptoms',
                                                          ] as const
                                                        ).map((h) => (
                                                          <th
                                                            key={h}
                                                            style={{
                                                              padding: '4px 8px',
                                                              textAlign: 'left',
                                                              color: T.textMuted,
                                                              fontWeight: 600,
                                                              borderBottom:
                                                                '1px solid ' + T.borderLight,
                                                              fontFamily: FONT,
                                                            }}
                                                          >
                                                            {h}
                                                          </th>
                                                        ))}
                                                      </tr>
                                                    </thead>
                                                    <tbody>
                                                      {qa.conditions.map((cond, ci) => (
                                                        <tr
                                                          key={ci}
                                                          style={{
                                                            background:
                                                              ci % 2 === 0 ? T.bgCard : T.bgAlt,
                                                          }}
                                                        >
                                                          <td
                                                            style={{
                                                              padding: '4px 8px',
                                                              color: T.text,
                                                              fontFamily: FONT,
                                                            }}
                                                          >
                                                            {cond.healthCondition}
                                                          </td>
                                                          <td
                                                            style={{
                                                              padding: '4px 8px',
                                                              color: T.text,
                                                              fontFamily: FONT,
                                                            }}
                                                          >
                                                            {cond.dateOfOnset ?? '—'}
                                                          </td>
                                                          <td
                                                            style={{
                                                              padding: '4px 8px',
                                                              color: T.text,
                                                              fontFamily: FONT,
                                                            }}
                                                          >
                                                            {cond.dateOfRecovery ?? '—'}
                                                          </td>
                                                          <td
                                                            style={{
                                                              padding: '4px 8px',
                                                              color: T.text,
                                                              fontFamily: FONT,
                                                            }}
                                                          >
                                                            {cond.isTreatment ? 'Yes' : 'No'}
                                                          </td>
                                                          <td
                                                            style={{
                                                              padding: '4px 8px',
                                                              color: T.text,
                                                              fontFamily: FONT,
                                                            }}
                                                          >
                                                            {cond.isMedicate ? 'Yes' : 'No'}
                                                          </td>
                                                          <td
                                                            style={{
                                                              padding: '4px 8px',
                                                              color: T.text,
                                                              fontFamily: FONT,
                                                            }}
                                                          >
                                                            {cond.dLastSeen ?? '—'}
                                                          </td>
                                                          <td
                                                            style={{
                                                              padding: '4px 8px',
                                                              color: T.text,
                                                              fontFamily: FONT,
                                                            }}
                                                          >
                                                            {cond.symptoms ?? '—'}
                                                          </td>
                                                        </tr>
                                                      ))}
                                                    </tbody>
                                                  </table>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    });
                                  })()}
                                </div>
                              </div>
                              {depNote && (
                                <div
                                  style={{
                                    marginTop: 12,
                                    borderRadius: 8,
                                    border: '1px solid ' + T.borderLight,
                                    overflow: 'hidden',
                                  }}
                                >
                                  <div
                                    style={{
                                      padding: '8px 12px',
                                      background: T.bgAlt,
                                      borderBottom: '1px solid ' + T.borderLight,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 7,
                                    }}
                                  >
                                    <HiOutlineClipboardList size={13} color={T.textMuted} />
                                    <span
                                      style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        color: T.textMuted,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        fontFamily: FONT,
                                      }}
                                    >
                                      Additional Notes
                                    </span>
                                  </div>
                                  <div style={{ padding: '12px 14px', background: T.bgCard }}>
                                    <p
                                      style={{
                                        fontSize: 12.5,
                                        color: T.text,
                                        fontWeight: 400,
                                        lineHeight: 1.6,
                                        fontFamily: FONT,
                                        margin: 0,
                                      }}
                                    >
                                      {depNote}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}

                {/* Browser & Device Info */}
                {activeTab === 'browser' &&
                  (() => {
                    const b = report?.browser ?? {
                      browser: '',
                      version: '',
                      platform: '',
                      deviceName: '',
                      ipAddress: '',
                      deviceType: '',
                    };
                    const browserName = b.browser || '';
                    const browserVersion = b.version || '';
                    const platformPart = b.platform || '';
                    const deviceType = b.deviceType || 'Desktop';
                    return (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: 14,
                        }}
                      >
                        <InfoRow label="Browser" value={browserName} T={T} />
                        <InfoRow label="Version" value={browserVersion} mono T={T} />
                        <InfoRow label="Platform" value={platformPart} T={T} />
                        <InfoRow label="Device Type" value={deviceType} T={T} />
                        <InfoRow label="IP Address" value={b.ipAddress} mono T={T} />
                        <InfoRow
                          label="Enrollment Timestamp"
                          value={report?.primary.signUpDate ?? '—'}
                          mono
                          T={T}
                          wide
                        />
                      </div>
                    );
                  })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
