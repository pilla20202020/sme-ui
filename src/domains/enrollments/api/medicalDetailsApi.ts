import { z } from 'zod';
import type { MedicalDetails } from '@/domains/enrollments/types/medicalDetails';

const API_BASE_V1 = import.meta.env.VITE_API_BASE_URL_V1;
if (!API_BASE_V1) throw new Error('Failed to configure API endpoint');

// ── Zod schema (runtime validation) ──────────────────────────────────────────

const CriticalAnalysisSchema = z.object({
  cost_estimation: z.string().nullish(),
  cost_estimation_factors: z
    .array(z.string())
    .nullish()
    .transform((v) => v ?? []),
  justification: z.string().nullish(),
  pre_existing_impact: z.string().nullish(),
  recommendation: z.string().nullish(),
  required_services: z
    .array(z.string())
    .nullish()
    .transform((v) => v ?? []),
  risk_assessment: z.string().nullish(),
  risk_factors: z
    .array(z.string())
    .nullish()
    .transform((v) => v ?? []),
  severity: z.string().nullish(),
  severity_justification: z.string().nullish(),
  total_monthly_drug_cost: z.string().nullish(),
  treatment_duration: z.string().nullish(),
  treatment_duration_reasoning: z.string().nullish(),
});

const DiseaseSchema = z.object({
  name: z.string().nullish(),
  associated_symptoms: z
    .array(z.string())
    .nullish()
    .transform((v) => v ?? []),
});

const SummarySchema = z.object({
  additional_info: z.string().nullish(),
  condition: z.string().nullish(),
  dosage: z.string().nullish(),
  drug_name: z.string().nullish(),
  monthly_cost: z.string().nullish(),
  price: z.string().nullish(),
  price_currency: z.string().nullish(),
  price_fluctuation: z.string().nullish(),
  reference_site: z.string().nullish(),
});

const MedicalDetailsResponseSchema = z.object({
  description: z.string().nullish(),
  policyId: z.union([z.string(), z.number()]),
  result: z
    .object({
      critical_analysis: CriticalAnalysisSchema.optional(),
      medical_analysis: z
        .object({
          diseases: z
            .array(DiseaseSchema)
            .nullish()
            .transform((v) => v ?? []),
          summaries: z
            .array(SummarySchema)
            .nullish()
            .transform((v) => v ?? []),
        })
        .optional(),
    })
    .optional(),
});

export type MedicalDetailsResponse = z.infer<typeof MedicalDetailsResponseSchema>;

// ── Fetch ─────────────────────────────────────────────────────────────────────

export async function fetchMedicalDetails(
  policyId: string,
  signal?: AbortSignal
): Promise<MedicalDetailsResponse> {
  const res = await fetch(`${API_BASE_V1}/enrollments/get-medical-details/${policyId}`, {
    signal,
    credentials: 'include',
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch medical details (${res.status}): ${errorText}`);
  }

  const raw = await res.json();
  return MedicalDetailsResponseSchema.parse(raw.data);
}

// ── Mapper ────────────────────────────────────────────────────────────────────

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

export function mapMedicalDetailsResponse(raw: MedicalDetailsResponse): MedicalDetails {
  const analysis = raw.result?.critical_analysis;
  const diseases = raw.result?.medical_analysis?.diseases ?? [];
  const summaries = raw.result?.medical_analysis?.summaries ?? [];

  return {
    loadState: 'success',
    recommendation: {
      recommendation: analysis?.recommendation ? [titleCase(analysis.recommendation)] : [],
      description: raw.description ?? '',
      justification: analysis?.justification ?? '',
      preExistingImpact: analysis?.pre_existing_impact ? [analysis.pre_existing_impact] : [],
      requiredServices: analysis?.required_services ?? [],
    },
    riskSeverity: {
      riskAssessment: analysis?.risk_assessment ? [titleCase(analysis.risk_assessment)] : [],
      riskFactors: analysis?.risk_factors ?? [],
      severity: analysis?.severity ? [titleCase(analysis.severity)] : [],
      severityJustification: analysis?.severity_justification ?? '',
      treatmentDuration: analysis?.treatment_duration ?? '',
      treatmentDurationReasoning: analysis?.treatment_duration_reasoning ?? '',
    },
    drugSummary: {
      associatedSymptoms: unique(diseases.flatMap((d) => d.associated_symptoms)),
      conditions: unique(
        diseases.map((d) => d.name).filter((name): name is string => Boolean(name))
      ),
      drugs: summaries.map((summary) => ({
        condition: summary.condition ?? 'No Data',
        dosage: summary.dosage ?? 'No Data',
        drugName: summary.drug_name ?? 'No Data',
        price: [summary.price, summary.price_currency].filter(Boolean).join(' ') || 'No Data',
        priceFluctuation: summary.price_fluctuation ?? 'No Data',
        actualMonthlyCost: summary.monthly_cost ?? 'No Data',
      })),
      referenceSites: unique(
        summaries.map((s) => s.reference_site).filter((site): site is string => Boolean(site))
      ),
      additionalInfo: unique(
        summaries.map((s) => s.additional_info).filter((info): info is string => Boolean(info))
      ),
    },
    costEstimation: {
      costEstimation: analysis?.cost_estimation ? [analysis.cost_estimation] : [],
      costEstimationFactors: analysis?.cost_estimation_factors ?? [],
      totalMonthlyCost: analysis?.total_monthly_drug_cost ? [analysis.total_monthly_drug_cost] : [],
    },
  };
}
