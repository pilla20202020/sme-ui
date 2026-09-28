// import type {
//   Enrollment,
//   EnrollmentStatus,
//   PhqAnswer,
//   ActivityEntry,
// } from "@/domains/enrollments/types";
// import { lightTokens as T } from "@/shared/theme";
// import { L713_PLANS } from "@/shared/constants/plans";
// import {
//   FIRST_NAMES,
//   LAST_NAMES,
//   AGENTS,
//   CARRIERS,
//   CITIES,
//   STREETS,
//   PHQ_QUESTIONS,
//   REJECTION_REASONS,
// } from "@/shared/constants/seeds";

// const STATUS_DIST: EnrollmentStatus[] = [
//   ...Array<EnrollmentStatus>(12).fill("Pending Underwriting"),
//   ...Array<EnrollmentStatus>(8).fill("Pending Response"),
//   ...Array<EnrollmentStatus>(8).fill("Pending Signature"),
//   ...Array<EnrollmentStatus>(8).fill("Ready to Activate"),
//   ...Array<EnrollmentStatus>(8).fill("Active"),
//   ...Array<EnrollmentStatus>(3).fill("Declined by UW"),
//   ...Array<EnrollmentStatus>(3).fill("Declined by Member"),
// ];

// export function generateEnrollments(): Enrollment[] {
//   return STATUS_DIST.map((status, i) => {
//     const fn = FIRST_NAMES[i % FIRST_NAMES.length];
//     const ln = LAST_NAMES[(i * 3 + 5) % LAST_NAMES.length];
//     const plan = L713_PLANS[i % L713_PLANS.length];
//     const agent = AGENTS[i % AGENTS.length];
//     const carrier = CARRIERS[i % CARRIERS.length];
//     const city = CITIES[i % CITIES.length];
//     const street = STREETS[i % STREETS.length];
//     const enrollMonth = 1 + (i % 5);
//     const enrollDay = 1 + (i % 28);
//     const sysId = "L713-" + String(10000 + i);
//     const userId = "USR-" + String(175000 + i);
//     const dobYear = 1960 + (i % 40);
//     const dob =
//       dobYear +
//       "-" +
//       String(1 + (i % 12)).padStart(2, "0") +
//       "-" +
//       String(1 + (i % 28)).padStart(2, "0");
//     const age = 2026 - dobYear;
//     const gender = i % 3 === 0 ? "Male" : i % 3 === 1 ? "Female" : "Male";
//     const ssn = "***-**-" + String(1000 + i).slice(-4);
//     const heightInches = 60 + (i % 16);
//     const heightFeet = Math.floor(heightInches / 12);
//     const heightRem = heightInches % 12;
//     const height = `${heightFeet}'${heightRem}"`;
//     const weight = 120 + ((i * 7) % 100) + " lbs";
//     const phone =
//       "(555) " +
//       String(100 + ((i * 3) % 900)).padStart(3, "0") +
//       "-" +
//       String(1000 + ((i * 7) % 9000)).padStart(4, "0");
//     const email = fn.toLowerCase() + "." + ln.toLowerCase() + "@email.com";
//     const enrollDate =
//       "2026-" +
//       String(enrollMonth).padStart(2, "0") +
//       "-" +
//       String(enrollDay).padStart(2, "0");
//     const recommendation = i % 4 !== 0 ? "Yes" : "No";
//     const answeredQuestions = status === "Pending Response" && i % 3 === 0;
//     const invoicePaid = status === "Active" && i % 2 === 0;
//     const riskFlag = i % 7 === 0 ? "high" : i % 5 === 0 ? "med" : null;

//     let effDate = "";
//     if (["Pending Signature", "Ready to Activate", "Active"].includes(status)) {
//       if (enrollDay <= 22) {
//         const nm = enrollMonth + 1 > 12 ? 1 : enrollMonth + 1;
//         const yr = enrollMonth + 1 > 12 ? 2027 : 2026;
//         effDate = yr + "-" + String(nm).padStart(2, "0") + "-01";
//       } else {
//         const nm =
//           enrollMonth + 2 > 12 ? enrollMonth + 2 - 12 : enrollMonth + 2;
//         const yr = enrollMonth + 2 > 12 ? 2027 : 2026;
//         effDate = yr + "-" + String(nm).padStart(2, "0") + "-01";
//       }
//     }

//     const phqAnswers: PhqAnswer[] = PHQ_QUESTIONS.map((q, qi) => ({
//       question: q,
//       answer: qi % 5 === 0 || qi % 3 === 0 ? "Yes" : "No",
//       detail:
//         qi % 5 === 0
//           ? "Managed with medication"
//           : qi % 3 === 0
//             ? "Under physician care"
//             : "",
//     }));

//     const depCount = i % 4;
//     const dependents = Array.from({ length: depCount }, (_, d) => ({
//       name: FIRST_NAMES[(i + d + 10) % FIRST_NAMES.length] + " " + ln,
//       relationship: (d === 0 ? "Spouse" : "Child") as "Spouse" | "Child",
//       dob: 1990 + d * 5 + "-03-15",
//       gender:
//         d === 0
//           ? gender === "Male"
//             ? "Female"
//             : "Male"
//           : d % 2 === 0
//             ? "Male"
//             : "Female",
//     }));

//     const emailLogs = [
//       {
//         id: "EML-" + (i * 100 + 1),
//         recipients: email,
//         subject: "Enrollment Confirmation",
//         dateSent: enrollDate + " 09:00",
//         status: "Delivered" as const,
//         reason: "",
//       },
//       {
//         id: "EML-" + (i * 100 + 2),
//         recipients: email,
//         subject: "Health Questionnaire Reminder",
//         dateSent: enrollDate + " 10:30",
//         status: (i % 7 === 0 ? "Bounced" : "Delivered") as
//           | "Delivered"
//           | "Bounced",
//         reason: i % 7 === 0 ? "Invalid mailbox" : "",
//       },
//       {
//         id: "EML-" + (i * 100 + 3),
//         recipients: agent.toLowerCase().replace(" ", ".") + "@agency.com",
//         subject: "New Enrollment Notification",
//         dateSent: enrollDate + " 09:05",
//         status: "Delivered" as const,
//         reason: "",
//       },
//       {
//         id: "EML-" + (i * 100 + 4),
//         recipients: email,
//         subject: "Document Upload Request",
//         dateSent: enrollDate + " 14:00",
//         status: (i % 11 === 0 ? "Failed" : "Delivered") as
//           | "Delivered"
//           | "Failed",
//         reason: i % 11 === 0 ? "Server timeout" : "",
//       },
//       {
//         id: "EML-" + (i * 100 + 4),
//         recipients: email,
//         subject: "Document Upload Request",
//         dateSent: enrollDate + " 14:00",
//         status: (i % 11 === 0 ? "Failed" : "Delivered") as
//           | "Delivered"
//           | "Failed",
//         reason: i % 11 === 0 ? "Server timeout" : "",
//       },
//       {
//         id: "EML-" + (i * 100 + 4),
//         recipients: email,
//         subject: "Document Upload Request",
//         dateSent: enrollDate + " 14:00",
//         status: (i % 11 === 0 ? "Failed" : "Delivered") as
//           | "Delivered"
//           | "Failed",
//         reason: i % 11 === 0 ? "Server timeout" : "",
//       },
//       {
//         id: "EML-" + (i * 100 + 4),
//         recipients: email,
//         subject: "Document Upload Request",
//         dateSent: enrollDate + " 14:00",
//         status: (i % 11 === 0 ? "Failed" : "Delivered") as
//           | "Delivered"
//           | "Failed",
//         reason: i % 11 === 0 ? "Server timeout" : "",
//       },
//       {
//         id: "EML-" + (i * 100 + 4),
//         recipients: email,
//         subject: "Document Upload Request",
//         dateSent: enrollDate + " 14:00",
//         status: (i % 11 === 0 ? "Failed" : "Delivered") as
//           | "Delivered"
//           | "Failed",
//         reason: i % 11 === 0 ? "Server timeout" : "",
//       },
//       {
//         id: "EML-" + (i * 100 + 4),
//         recipients: email,
//         subject: "Document Upload Request",
//         dateSent: enrollDate + " 14:00",
//         status: (i % 11 === 0 ? "Failed" : "Delivered") as
//           | "Delivered"
//           | "Failed",
//         reason: i % 11 === 0 ? "Server timeout" : "",
//       },
//       {
//         id: "EML-" + (i * 100 + 4),
//         recipients: email,
//         subject: "Document Upload Request",
//         dateSent: enrollDate + " 14:00",
//         status: (i % 11 === 0 ? "Failed" : "Delivered") as
//           | "Delivered"
//           | "Failed",
//         reason: i % 11 === 0 ? "Server timeout" : "",
//       },
//       {
//         id: "EML-" + (i * 100 + 4),
//         recipients: email,
//         subject: "Document Upload Request",
//         dateSent: enrollDate + " 14:00",
//         status: (i % 11 === 0 ? "Failed" : "Delivered") as
//           | "Delivered"
//           | "Failed",
//         reason: i % 11 === 0 ? "Server timeout" : "",
//       },
//       {
//         id: "EML-" + (i * 100 + 4),
//         recipients: email,
//         subject: "Document Upload Request",
//         dateSent: enrollDate + " 14:00",
//         status: (i % 11 === 0 ? "Failed" : "Delivered") as
//           | "Delivered"
//           | "Failed",
//         reason: i % 11 === 0 ? "Server timeout" : "",
//       },
//     ];
//     if (["Pending Signature", "Ready to Activate", "Active"].includes(status)) {
//       emailLogs.push({
//         id: "EML-" + (i * 100 + 5),
//         recipients: email,
//         subject: "Signature Request — DocuSign",
//         dateSent: enrollDate + " 16:00",
//         status: "Delivered" as const,
//         reason: "",
//       });
//     }

//     const hasAnswered =
//       answeredQuestions ||
//       ["Pending Signature", "Ready to Activate", "Active"].includes(status);
//     const qaThreads = [];
//     if (
//       [
//         "Pending Response",
//         "Pending Signature",
//         "Ready to Activate",
//         "Active",
//       ].includes(status) ||
//       answeredQuestions
//     ) {
//       qaThreads.push({
//         round: 1,
//         dateSent: enrollDate + " 10:00",
//         questions: [
//           "Please clarify your response regarding prescription medications.",
//           "What is the dosage for your current medications?",
//         ],
//         answers: hasAnswered
//           ? [
//               "I take Lisinopril 10mg daily for blood pressure.",
//               "10mg once daily as prescribed by Dr. Smith.",
//             ]
//           : null,
//         dateAnswered: hasAnswered
//           ? "2026-" +
//             String(enrollMonth).padStart(2, "0") +
//             "-" +
//             String(Math.min(enrollDay + 3, 28)).padStart(2, "0") +
//             " 14:22"
//           : null,
//       });
//     }
//     if (
//       ["Pending Signature", "Ready to Activate", "Active"].includes(status) &&
//       i % 3 === 0
//     ) {
//       qaThreads.push({
//         round: 2,
//         dateSent:
//           "2026-" +
//           String(enrollMonth).padStart(2, "0") +
//           "-" +
//           String(Math.min(enrollDay + 4, 28)).padStart(2, "0") +
//           " 09:00",
//         questions: [
//           "Can you provide documentation from your physician regarding the managed condition?",
//         ],
//         answers: [
//           "Attached physician letter confirming stable condition for 3+ years.",
//         ],
//         dateAnswered:
//           "2026-" +
//           String(enrollMonth).padStart(2, "0") +
//           "-" +
//           String(Math.min(enrollDay + 5, 28)).padStart(2, "0") +
//           " 11:30",
//       });
//     }

//     const notes = [
//       {
//         text: "Initial enrollment received and verified.",
//         author: "System",
//         date: enrollDate + " 09:00",
//       },
//       ...(i % 3 === 0
//         ? [
//             {
//               text: "Contacted agent for additional documentation.",
//               author: "Dinesh C. Thakuri",
//               date: enrollDate + " 14:30",
//             },
//           ]
//         : []),
//       ...(i % 5 === 0
//         ? [
//             {
//               text: "Member confirmed contact information is correct.",
//               author: "Dinesh C. Thakuri",
//               date: enrollDate + " 15:45",
//             },
//           ]
//         : []),
//     ];

//     const activities: ActivityEntry[] = [
//       {
//         action: "Enrollment submitted",
//         date: enrollDate + " 08:45",
//         actor: "Member",
//         color: T.indigo,
//       },
//       {
//         action: "PHQ completed",
//         date: enrollDate + " 09:00",
//         actor: "Member",
//         color: T.blue,
//       },
//       {
//         action: "Assigned to underwriting queue",
//         date: enrollDate + " 09:05",
//         actor: "System",
//         color: T.slate,
//       },
//     ];
//     if (
//       [
//         "Pending Response",
//         "Pending Signature",
//         "Ready to Activate",
//         "Active",
//       ].includes(status)
//     )
//       activities.push({
//         action: "Questions sent to member (Round 1)",
//         date: enrollDate + " 10:00",
//         actor: "Dinesh C. Thakuri",
//         color: T.sky,
//       });
//     if (["Pending Signature", "Ready to Activate", "Active"].includes(status)) {
//       activities.push({
//         action: "Member responded to questions",
//         date: enrollDate + " 14:00",
//         actor: "Member",
//         color: T.teal,
//       });
//       activities.push({
//         action: "Plan approved and sent for signature",
//         date: enrollDate + " 15:00",
//         actor: "Dinesh C. Thakuri",
//         color: T.green,
//       });
//     }
//     if (["Ready to Activate", "Active"].includes(status))
//       activities.push({
//         action: "Signature received via DocuSign",
//         date: enrollDate + " 16:00",
//         actor: "Member",
//         color: T.purple,
//       });
//     if (status === "Active")
//       activities.push({
//         action: "Policy activated",
//         date: effDate + " 00:01",
//         actor: "System",
//         color: T.green,
//       });
//     if (status === "Declined by UW")
//       activities.push({
//         action: "Declined by underwriting",
//         date: enrollDate + " 11:00",
//         actor: "Dinesh C. Thakuri",
//         color: T.red,
//       });
//     if (status === "Declined by Member")
//       activities.push({
//         action: "Member declined to proceed",
//         date: enrollDate + " 16:00",
//         actor: "Member",
//         color: T.red,
//       });

//     const rejectionInfo =
//       status === "Declined by UW"
//         ? {
//             reason: REJECTION_REASONS[i % 4],
//             notes: "Applicant has conditions exceeding underwriting threshold.",
//             declinedBy: "Dinesh C. Thakuri",
//             declinedDate: enrollDate,
//           }
//         : status === "Declined by Member"
//           ? {
//               reason: "Member declined signing",
//               notes: "Member chose not to proceed with offered plan.",
//               declinedBy: "Member",
//               declinedDate: enrollDate,
//             }
//           : null;

//     return {
//       key: sysId,
//       sysId,
//       userId,
//       status,
//       firstName: fn,
//       lastName: ln,
//       name: fn + " " + ln,
//       email,
//       phone,
//       gender,
//       dob,
//       age,
//       ssn,
//       height,
//       weight,
//       address: street + ", " + city,
//       agentName: agent,
//       agentRepCode: "REP-" + String(2000 + (i % 10)),
//       agentNumber: "AGT-" + String(5000 + (i % 10)),
//       carrier,
//       enrollDate,
//       effectiveDate: effDate,
//       planId: plan.id,
//       planName: plan.name,
//       premium: plan.premium,
//       tier: plan.tier,
//       recommendation: recommendation as "Yes" | "No",
//       answeredQuestions,
//       invoicePaid,
//       riskFlag: riskFlag as "high" | "med" | null,
//       paymentMethod: i % 2 === 0 ? "Credit Card" : "ACH",
//       recurringMethod: i % 2 === 0 ? "Auto-pay" : "Manual",
//       phqAnswers,
//       dependents,
//       emailLogs,
//       qaThreads,
//       notes,
//       activities,
//       rejectionInfo,
//       browser:
//         i % 3 === 0
//           ? "Chrome 120.0 / Windows 11"
//           : i % 3 === 1
//             ? "Safari 17.2 / macOS Sonoma"
//             : "Firefox 121.0 / Ubuntu 22.04",
//       ipAddress: "192.168." + (i % 255) + "." + ((i * 7) % 255),
//       enrollmentTimestamp: enrollDate + " 08:45:32 UTC",
//     };
//   });
// }

// export const ALL_ENROLLMENTS: Enrollment[] = generateEnrollments();



