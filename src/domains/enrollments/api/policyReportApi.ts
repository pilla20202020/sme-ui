import z from 'zod';

const API_BASE_V1 = import.meta.env.VITE_API_BASE_URL_V1;
if (!API_BASE_V1) throw new Error('Failed to configure API endpoint');

const ApiPolicyReportItemSchema = z.object({
  policyDetails: z.object({
    policyId: z.number(),

    plans: z.array(
      z.object({
        name: z.string(),
        tier: z.string(),
      })
    ),

    healthPlan: z.object({
      name: z.string(),
      tier: z.string(),
    }),

    enrollmentDate: z.string(),
    effectiveDate: z.string(),

    priorCarrierName: z.string().nullable(),
    priorCarrierEffectiveDate: z.string().nullable(),
    priorCarrierTermDate: z.string().nullable(),

    paymentType: z.string().nullable(),
    recurringPaymentType: z.string().nullable(),
  }),

  primaryInfo: z.object({
    id: z.number(),
    fullname: z.string(),
    firstName: z.string(),
    middleName: z.string().nullable(),
    lastName: z.string(),
    email: z.string(),

    dob: z.string(),
    formattedDob: z.string(),

    gender: z.string(),

    heightFeet: z.number().nullable(),
    heightInches: z.number().nullable(),
    weightLbs: z.number(),

    formattedSsn: z.string(),

    signUpDate: z.string(),
  }),

  contactInfo: z.object({
    email: z.string(),
    phone: z.string(),
    address1: z.string(),
    address2: z.string().nullable(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
  }),

  agentInfo: z.object({
    id: z.number(),
    code: z.string(),
    fullname: z.string(),
    firstName: z.string(),
    middleName: z.string().nullable(),
    lastName: z.string(),

    phone: z.string(),
    address1: z.string(),
    address2: z.string().nullable(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
  }),

  paymentInfo: z
    .object({
      payment: z
        .object({
          bankId: z.number().nullish(),
          bankName: z.string().nullish(),
          bankAccountName: z.string().nullish(),
          formattedBankAccount: z.string().nullish(),
        })
        .nullish(),

      recurringPayment: z
        .object({
          bankId: z.number().nullish(),
          bankName: z.string().nullish(),
          bankAccountName: z.string().nullish(),
          formattedBankAccount: z.string().nullish(),
        })
        .nullish(),
    })
    .nullish(),

  personalHealthQuestionnaire: z.array(
    z.object({
      medId: z.number(),
      question: z.string(),
      selectedAnswer: z.string(),
      additionalNotes: z.string().nullable(),
      dependentId: z.number().nullable(),

      medMedications: z.array(
        z.object({
          medication: z.string().nullable(),
          dosage: z.string().nullable(),
          medical_condition: z.string().nullable(),
        })
      ),
      medConditions: z.array(
        z.object({
          health_condition: z.string().nullable(),
          date_of_onset: z.string().nullable(),
          date_of_recovery: z.string().nullable(),
          is_treatment: z.string().nullable(),
          is_medicate: z.string().nullable(),
          d_last_seen: z.string().nullable(),
          symptoms: z.string().nullable(),
        })
      ),
    })
  ),

  dependents: z.array(
    z.object({
      id: z.number(),
      fullname: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      dob: z.string(),
      formattedDob: z.string().optional(),
      gender: z.string(),
      relation: z.string(),
      formattedSsn: z.string(),
      healthAnswers: z
        .array(
          z.object({
            medId: z.number(),
            question: z.string(),
            selectedAnswer: z.string(),
            additionalNotes: z.string().nullable(),
            dependentId: z.number().nullable(),
            medMedications: z.array(
              z.object({
                medication: z.string().nullable(),
                dosage: z.string().nullable(),
                medical_condition: z.string().nullable(),
              })
            ),
            medConditions: z.array(
              z.object({
                health_condition: z.string().nullable(),
                date_of_onset: z.string().nullable(),
                date_of_recovery: z.string().nullable(),
                is_treatment: z.string().nullable(),
                is_medicate: z.string().nullable(),
                d_last_seen: z.string().nullable(),
                symptoms: z.string().nullable(),
              })
            ),
          })
        )
        .optional()
        .default([]),
    })
  ),

  browserDeviceInfo: z
    .object({
      browser: z.string().nullish(),
      version: z.string().nullish(),
      platform: z.string().nullish(),
      deviceName: z.string().nullish(),
      ipAddress: z.string().nullish(),
      deviceType: z.string().nullish(),
    })
    .nullish(),
});

export type ApiPolicyReportItem = z.infer<typeof ApiPolicyReportItemSchema>;

export interface PolicyReportViewModel {
  policy: {
    policyId: string;
    planName: string;
    enrollmentDate: string;
    effectiveDate: string;
    priorCarrierName: string | null;
    priorCarrierEffectiveDate: string | null;
    priorCarrierTermDate: string | null;
    paymentType: string | null;
    recurringPaymentType: string | null;
    healthPlanName: string;
    healthPlanTier: string;
  };
  primary: {
    id: number;
    fullname: string;
    firstName: string;
    lastName: string;
    gender: string;
    dob: string;
    maskedDob: string;
    heightFeet: number | null;
    heightInches: number | null;
    weightLbs: number;
    maskedSsn: string;
    signUpDate: string;
  };
  contact: {
    email: string;
    phone: string;
    address1: string;
    address2?: string | null;
    city: string;
    state: string;
    zip: string;
  };
  agent: {
    id: number;
    code: string;
    fullname: string;
    firstName: string;
    lastName: string;
  };
  payment: {
    paymentMethod: string | null;
    recurringMethod: string | null;
    paymentBankName: string | null;
    recurringBankName: string | null;
    paymentAccountNumber: string | null;
    recurringAccountNumber: string | null;
  };
  questionnaire: Array<{
    medId: number;
    dependentId: number | null;
    question: string;
    additionalNotes: string | null;
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
  }>;
  dependents: Array<{
    id: number;
    fullname: string;
    firstName: string;
    lastName: string;
    dob: string;
    gender: string;
    relationship: string;
    ssn: string;
    healthAnswers: Array<{
      medId: number;
      question: string;
      selectedAnswer: string;
      additionalNotes: string | null;
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
    }>;
  }>;
  browser: {
    browser: string | null;
    version: string | null;
    platform: string | null;
    deviceName: string | null;
    ipAddress: string | null;
    deviceType: string | null;
  };
}

export function mapApiPolicyReportToViewModel(item: ApiPolicyReportItem): PolicyReportViewModel {
  return {
    policy: {
      policyId: String(item.policyDetails.policyId),
      planName: item.policyDetails.healthPlan.name,

      enrollmentDate: item.policyDetails.enrollmentDate,
      effectiveDate: item.policyDetails.effectiveDate,

      priorCarrierName: item.policyDetails.priorCarrierName,
      priorCarrierEffectiveDate: item.policyDetails.priorCarrierEffectiveDate,
      priorCarrierTermDate: item.policyDetails.priorCarrierTermDate,

      paymentType: item.policyDetails.paymentType,
      recurringPaymentType: item.policyDetails.recurringPaymentType,

      healthPlanName: item.policyDetails.healthPlan.name,
      healthPlanTier: item.policyDetails.healthPlan.tier,
    },

    primary: {
      id: item.primaryInfo.id,

      fullname: item.primaryInfo.fullname,
      firstName: item.primaryInfo.firstName,
      lastName: item.primaryInfo.lastName,

      gender: item.primaryInfo.gender,

      dob: item.primaryInfo.dob,
      maskedDob: item.primaryInfo.formattedDob,

      heightFeet: item.primaryInfo.heightFeet,
      heightInches: item.primaryInfo.heightInches,
      weightLbs: item.primaryInfo.weightLbs,

      maskedSsn: item.primaryInfo.formattedSsn,

      signUpDate: item.primaryInfo.signUpDate,
    },

    contact: {
      email: item.contactInfo.email,
      phone: item.contactInfo.phone,

      address1: item.contactInfo.address1,
      address2: item.contactInfo.address2,

      city: item.contactInfo.city,
      state: item.contactInfo.state,
      zip: item.contactInfo.zip,
    },

    agent: {
      id: item.agentInfo.id,
      code: item.agentInfo.code,

      fullname: item.agentInfo.fullname,
      firstName: item.agentInfo.firstName,
      lastName: item.agentInfo.lastName,
    },

    payment: {
      paymentMethod: item.policyDetails.paymentType,
      recurringMethod: item.policyDetails.recurringPaymentType,

      paymentBankName: item.paymentInfo?.payment?.bankName ?? null,
      recurringBankName: item.paymentInfo?.recurringPayment?.bankName ?? null,

      paymentAccountNumber: item.paymentInfo?.payment?.formattedBankAccount ?? null,

      recurringAccountNumber: item.paymentInfo?.recurringPayment?.formattedBankAccount ?? null,
    },

    questionnaire: item.personalHealthQuestionnaire.map((q) => ({
      medId: q.medId,
      dependentId: q.dependentId ?? null,
      question: q.question,
      additionalNotes: q.additionalNotes ?? null,
      selectedAnswer: q.selectedAnswer,
      medMedications: q.medMedications.map((m) => ({
        medication: m.medication,
        dosage: m.dosage,
        medicalCondition: m.medical_condition,
      })),
      medConditions: q.medConditions.map((c) => ({
        healthCondition: c.health_condition,
        dateOfOnset: c.date_of_onset,
        dateOfRecovery: c.date_of_recovery,
        isTreatment: c.is_treatment === '1',
        isMedicate: c.is_medicate === '1',
        dLastSeen: c.d_last_seen,
        symptoms: c.symptoms,
      })),
    })),

    dependents: item.dependents.map((dep) => ({
      id: dep.id,
      fullname: dep.fullname,
      firstName: dep.firstName,
      lastName: dep.lastName,
      dob: dep.dob,
      gender: dep.gender,
      relationship: dep.relation,
      ssn: dep.formattedSsn,
      healthAnswers: (dep.healthAnswers ?? []).map((q) => ({
        medId: q.medId,
        question: q.question,
        selectedAnswer: q.selectedAnswer,
        additionalNotes: q.additionalNotes ?? null,
        medMedications: q.medMedications.map((m) => ({
          medication: m.medication,
          dosage: m.dosage,
          medicalCondition: m.medical_condition,
        })),
        medConditions: q.medConditions.map((c) => ({
          healthCondition: c.health_condition,
          dateOfOnset: c.date_of_onset,
          dateOfRecovery: c.date_of_recovery,
          isTreatment: c.is_treatment === '1',
          isMedicate: c.is_medicate === '1',
          dLastSeen: c.d_last_seen,
          symptoms: c.symptoms,
        })),
      })),
    })),

    browser: {
      browser: item.browserDeviceInfo?.browser ?? null,
      version: item.browserDeviceInfo?.version ?? null,
      platform: item.browserDeviceInfo?.platform ?? null,

      deviceName: item.browserDeviceInfo?.deviceName ?? null,

      ipAddress: item.browserDeviceInfo?.ipAddress ?? null,
      deviceType: item.browserDeviceInfo?.deviceType ?? null,
    },
  };
}

export const fetchPolicyReport = async (
  policyId: string,
  signal?: AbortSignal
): Promise<PolicyReportViewModel> => {
  const params = new URLSearchParams({ policyId });
  const url = `${API_BASE_V1}/enrollments/policy-report?${params.toString()}`;

  const response = await fetch(url, {
    signal,
    credentials: 'include',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch policy report for policy ID ${policyId} (${response.status}): ${errorText}`
    );
  }

  const data = await response.json();
  const candidateCandidates: any[] = [];
  candidateCandidates.push(data.data);

  if (data && typeof data === 'object' && 'data' in data) candidateCandidates.push(data.data.data);
  if (Array.isArray(data)) candidateCandidates.push(data[0]);
  if (data && typeof data === 'object' && 'report' in data) candidateCandidates.push(data.report);

  let parsed: ApiPolicyReportItem | null = null;
  let lastError: unknown = null;

  for (const candidate of candidateCandidates) {
    if (!candidate) continue;
    try {
      parsed = ApiPolicyReportItemSchema.parse(candidate);
      break;
    } catch (err) {
      lastError = err;
    }
  }
  if (!parsed) {
    console.error('[policyReportApi] failed to parse policy report payload:', lastError);
    throw new Error('Failed to parse policy report payload — unexpected response shape');
  }
  const vm = mapApiPolicyReportToViewModel(parsed);
  return vm;
};
