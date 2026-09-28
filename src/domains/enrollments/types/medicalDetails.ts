export interface DrugEntry {
  condition: string;
  dosage: string;
  drugName: string;
  price: string;
  priceFluctuation: string;
  actualMonthlyCost: string;
}

export interface MedicalRecommendation {
  recommendation: string[];
  description: string;
  justification: string;
  preExistingImpact: string[];
  requiredServices: string[];
}

export interface MedicalRiskSeverity {
  riskAssessment: string[];
  riskFactors: string[];
  severity: string[];
  severityJustification: string;
  treatmentDuration: string;
  treatmentDurationReasoning: string;
}

export interface MedicalDrugSummary {
  associatedSymptoms: string[];
  conditions: string[];
  drugs: DrugEntry[];
  referenceSites: string[];
  additionalInfo: string[];
}

export interface MedicalCostEstimation {
  costEstimation: string[];
  costEstimationFactors: string[];
  totalMonthlyCost: string[];
}

export type MedicalDetailsLoadState = 'loading' | 'error' | 'success';

export interface MedicalDetails {
  loadState: MedicalDetailsLoadState;
  recommendation: MedicalRecommendation;
  riskSeverity: MedicalRiskSeverity;
  drugSummary: MedicalDrugSummary;
  costEstimation: MedicalCostEstimation;
}
