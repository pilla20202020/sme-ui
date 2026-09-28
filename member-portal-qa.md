# Member Portal — Question & Answer Feature

## Overview

This feature enables an underwriter (admin) to send follow-up questions to a member after reviewing an enrollment application. The member receives a secure email link, verifies their identity via OTP, and submits answers through a dedicated portal. All responses are saved and made visible to the admin in the underwriting portal.

---

## Table of Contents

1. [Architecture](#1-architecture)
2. [Database Schema](#2-database-schema)
3. [Environment Variables](#3-environment-variables)
4. [Security Model](#4-security-model)
5. [Admin API Endpoints](#5-admin-api-endpoints)
6. [Member Portal API Endpoints](#6-member-portal-api-endpoints)
7. [Email Payloads](#7-email-payloads)
8. [Frontend Integration Guide](#8-frontend-integration-guide)

---

## 1. Architecture

```
modules/enrollments/
├── controllers/
│   ├── enrollment-questions.controller.ts   ← Admin endpoints
│   └── member-questions.controller.ts       ← Member portal endpoints
├── services/
│   ├── send-questions.service.ts
│   ├── get-question-log.service.ts
│   ├── generate-member-link.service.ts      ← JWT signing / verification
│   ├── send-otp.service.ts
│   ├── verify-otp.service.ts
│   └── submit-answers.service.ts
├── repositories/
│   ├── question-thread.repository.ts
│   ├── question-message.repository.ts
│   └── otp.repository.ts
├── guards/
│   └── portal-session.guard.ts              ← Bearer token guard for member routes
└── dto/
    ├── send-questions.dto.ts
    ├── send-otp.dto.ts
    ├── verify-otp.dto.ts
    └── submit-answers.dto.ts
```

**Flow summary:**

```
Admin sends questions
  → QuestionThread created (or reused)
  → QuestionMessages saved (status: PENDING)
  → Enrollment status → pending_response
  → Signed JWT link emailed to member

Member clicks link
  → GET /member/questions/access?token=...  (validates JWT)
  → POST /member/questions/send-otp         (generates & emails OTP)
  → POST /member/questions/verify-otp       (validates OTP → issues session token)
  → GET  /member/questions                  (fetch pending questions)
  → POST /member/questions/answers          (submit answers → status: ANSWERED)
```

---

## 2. Database Schema

### `question_threads`

| Column        | Type        | Notes                            |
|---------------|-------------|----------------------------------|
| id            | BIGSERIAL   | Primary key                      |
| enrollment_id | BIGINT      | FK → `l713_enrollments.id`       |
| created_by    | INTEGER     | FK → `users.user_id` (admin)     |
| created_at    | TIMESTAMP   |                                  |
| updated_at    | TIMESTAMP   |                                  |

One thread per enrollment. If a thread already exists when new questions are sent, it is reused.

---

### `question_messages`

| Column          | Type                     | Notes                               |
|-----------------|--------------------------|-------------------------------------|
| id              | BIGSERIAL                | Primary key                         |
| thread_id       | BIGINT                   | FK → `question_threads.id`          |
| message_type    | `message_type` enum      | Always `QUESTION`                   |
| question_text   | TEXT                     | The question                        |
| answer_text     | TEXT (nullable)          | Filled when member responds         |
| status          | `question_message_status`| `PENDING` or `ANSWERED`             |
| sent_by_user_id | INTEGER                  | FK → `users.user_id` (admin)        |
| sent_at         | TIMESTAMP                | When the question was sent          |
| responded_at    | TIMESTAMP (nullable)     | When the member submitted an answer |
| created_at      | TIMESTAMP                |                                     |
| updated_at      | TIMESTAMP                |                                     |

**Enums:**

```sql
CREATE TYPE message_type AS ENUM ('QUESTION');
CREATE TYPE question_message_status AS ENUM ('PENDING', 'ANSWERED');
```

---

### `member_portal_otps`

| Column        | Type              | Notes                                      |
|---------------|-------------------|--------------------------------------------|
| id            | BIGSERIAL         | Primary key                                |
| enrollment_id | BIGINT            | FK → `l713_enrollments.id`                 |
| email         | VARCHAR(255)      | Member email the OTP was sent to           |
| otp_code      | VARCHAR(10)       | 6-digit code                               |
| expires_at    | TIMESTAMP         | 10 minutes from creation                   |
| used_at       | TIMESTAMP (null)  | Set when OTP is consumed; prevents re-use  |
| created_at    | TIMESTAMP         |                                            |

OTPs are single-use. A record with a non-null `used_at` or a past `expires_at` is rejected.

---

## 3. Environment Variables

| Variable                  | Required | Description                                                   |
|---------------------------|----------|---------------------------------------------------------------|
| `MEMBER_PORTAL_JWT_SECRET`| ✅       | HS256 secret used to sign/verify all member portal tokens     |
| `APP_URL`                 | ✅       | Base URL of the backend API; used to build the access link    |
| `APP_ORIGIN`              |          | Origin header sent to Message Center when sending emails      |

---

## 4. Security Model

### Access Link JWT

Signed with `MEMBER_PORTAL_JWT_SECRET` (HS256). Valid for **24 hours**.

```json
{
  "enrollmentId": "123",
  "questionThreadId": "456",
  "email": "member@example.com",
  "iat": 1718400000,
  "exp": 1718486400
}
```

The access link URL format is:

```
{APP_URL}/v1/member/questions/access?token={jwt}
```

### OTP

- 6-digit, cryptographically random (`crypto.randomBytes`)
- Expires in **10 minutes**
- Single-use — marked `used_at` immediately on verification
- A new OTP request always creates a new record; old unused ones become irrelevant

### Portal Session Token

Signed with the same `MEMBER_PORTAL_JWT_SECRET`. Valid for **30 minutes**. Issued after successful OTP verification.

Sent as `Authorization: Bearer <token>` on all subsequent member portal requests.

---

## 5. Admin API Endpoints

All admin endpoints require the standard admin cookie authentication (`uw_access_token`).

Base path: `/v1/enrollments`

---

### POST `/v1/enrollments/:id/questions`

Send follow-up questions to a member.

**Path Parameters**

| Param | Type   | Description   |
|-------|--------|---------------|
| id    | number | Enrollment ID |

**Request Body**

```json
{
  "questions": [
    "Do you have any pre-existing conditions?",
    "Please describe your current medications."
  ]
}
```

| Field     | Type       | Rules                       |
|-----------|------------|-----------------------------|
| questions | `string[]` | Min 1 item, each non-empty  |

**Response — 201 Created**

```json
{
  "threadId": "456",
  "questionCount": 2,
  "memberLink": "https://api.example.com/v1/member/questions/access?token=eyJ..."
}
```

| Field         | Type   | Description                                      |
|---------------|--------|--------------------------------------------------|
| threadId      | string | ID of the question thread (BigInt as string)     |
| questionCount | number | Number of questions saved                        |
| memberLink    | string | The full access link that was emailed to member  |

**Side effects:**
- Enrollment status is set to `pending_response` if not already.
- A question email is sent to the member via Message Center.

---

### GET `/v1/enrollments/:id/questions`

Retrieve the full question and answer log for an enrollment.

**Path Parameters**

| Param | Type   | Description   |
|-------|--------|---------------|
| id    | number | Enrollment ID |

**Response — 200 OK**

```json
[
  {
    "id": "1",
    "question": "Do you have any pre-existing conditions?",
    "answer": "No, I do not have any pre-existing conditions.",
    "status": "ANSWERED",
    "sentAt": "2026-06-15T10:00:00.000Z",
    "respondedAt": "2026-06-15T14:32:00.000Z"
  },
  {
    "id": "2",
    "question": "Please describe your current medications.",
    "answer": null,
    "status": "PENDING",
    "sentAt": "2026-06-15T10:00:00.000Z",
    "respondedAt": null
  }
]
```

| Field       | Type              | Description                          |
|-------------|-------------------|--------------------------------------|
| id          | string            | Question message ID                  |
| question    | string            | The question text                    |
| answer      | string \| null    | The member's answer, or null         |
| status      | `PENDING\|ANSWERED` | Current question status            |
| sentAt      | ISO 8601 string   | When the question was sent           |
| respondedAt | ISO 8601 \| null  | When the member answered, or null    |

Results are ordered chronologically by `sent_at`.

---

## 6. Member Portal API Endpoints

All member portal endpoints are public (no admin cookie required). The `GET /member/questions` and `POST /member/questions/answers` endpoints additionally require a portal session token in the `Authorization` header.

Base path: `/v1/member/questions`

---

### GET `/v1/member/questions/access`

Validate the signed access link JWT. Called when the member first opens the link.

**Query Parameters**

| Param | Type   | Description        |
|-------|--------|--------------------|
| token | string | JWT from the email |

**Response — 200 OK**

```json
{
  "valid": true,
  "email": "member@example.com"
}
```

**Response — 401 Unauthorized**

```json
{
  "statusCode": 401,
  "message": "Invalid or expired access token"
}
```

---

### POST `/v1/member/questions/send-otp`

Generate and send a 6-digit OTP to the member's email. Call this after validating the access token.

**Request Body**

```json
{
  "token": "eyJhbGci..."
}
```

| Field | Type   | Description                   |
|-------|--------|-------------------------------|
| token | string | The JWT from the access link  |

**Response — 201 Created**

```json
{
  "message": "OTP sent to your email address"
}
```

---

### POST `/v1/member/questions/verify-otp`

Verify the OTP submitted by the member and issue a short-lived portal session token.

**Request Body**

```json
{
  "token": "eyJhbGci...",
  "otp": "482931"
}
```

| Field | Type   | Rules            |
|-------|--------|------------------|
| token | string | JWT from the link |
| otp   | string | Exactly 6 digits  |

**Response — 201 Created**

```json
{
  "accessToken": "eyJhbGci..."
}
```

| Field       | Type   | Description                                              |
|-------------|--------|----------------------------------------------------------|
| accessToken | string | 30-minute portal session JWT; use as `Authorization: Bearer` header |

**Response — 401 Unauthorized**

```json
{
  "statusCode": 401,
  "message": "Invalid or expired OTP"
}
```

---

### GET `/v1/member/questions`

Fetch all pending questions for the member to answer.

**Headers**

```
Authorization: Bearer <accessToken>
```

**Response — 200 OK**

```json
[
  {
    "id": "1",
    "question": "Do you have any pre-existing conditions?",
    "sentAt": "2026-06-15T10:00:00.000Z"
  },
  {
    "id": "2",
    "question": "Please describe your current medications.",
    "sentAt": "2026-06-15T10:00:00.000Z"
  }
]
```

| Field    | Type            | Description               |
|----------|-----------------|---------------------------|
| id       | string          | Question ID to reference when submitting answers |
| question | string          | The question text         |
| sentAt   | ISO 8601 string | When the question was sent |

Only `PENDING` questions are returned. Already-answered questions are excluded.

---

### POST `/v1/member/questions/answers`

Submit answers to pending questions.

**Headers**

```
Authorization: Bearer <accessToken>
```

**Request Body**

```json
{
  "answers": [
    {
      "questionId": 1,
      "answer": "No, I do not have any pre-existing conditions."
    },
    {
      "questionId": 2,
      "answer": "I take Metformin 500mg daily."
    }
  ]
}
```

| Field              | Type     | Rules                |
|--------------------|----------|----------------------|
| answers            | array    | Min 1 item           |
| answers[].questionId | number | ID from GET /member/questions |
| answers[].answer   | string   | Non-empty            |

**Response — 201 Created**

```json
{
  "answeredCount": 2
}
```

| Field         | Type   | Description                    |
|---------------|--------|--------------------------------|
| answeredCount | number | Number of questions just answered |

**Side effects:**
- Each answered question: `status` → `ANSWERED`, `answer_text` saved, `responded_at` set.

---

## 7. Email Payloads

Emails are sent via the existing `MessageCenterNotificationAdapter`. The `contentData` object is passed to the Message Center template engine.

### Question Notification Email (sent to member)

```json
{
  "to": "member@example.com",
  "subject": "Action Required: Questions from your Underwriter",
  "contentData": {
    "memberName": "John Smith",
    "enrollmentRef": "100042",
    "accessLink": "https://api.example.com/v1/member/questions/access?token=eyJ...",
    "questionCount": 2
  }
}
```

### OTP Email (sent to member)

```json
{
  "to": "member@example.com",
  "subject": "Your One-Time Passcode",
  "contentData": {
    "otpCode": "482931",
    "expiryMinutes": 10
  }
}
```

---

## 8. Frontend Integration Guide

### Admin Portal

#### Step 1 — Send Questions

```typescript
// POST /v1/enrollments/:id/questions
const sendQuestions = async (enrollmentId: number, questions: string[]) => {
  const res = await api.post(`/v1/enrollments/${enrollmentId}/questions`, { questions });
  return res.data; // { threadId, questionCount, memberLink }
};
```

React Query mutation:

```typescript
const useSendQuestions = (enrollmentId: number) =>
  useMutation({
    mutationFn: (questions: string[]) =>
      api.post(`/v1/enrollments/${enrollmentId}/questions`, { questions }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments', enrollmentId, 'questions'] });
    },
  });
```

#### Step 2 — Display Question Log

```typescript
const useQuestionLog = (enrollmentId: number) =>
  useQuery({
    queryKey: ['enrollments', enrollmentId, 'questions'],
    queryFn: () =>
      api.get(`/v1/enrollments/${enrollmentId}/questions`).then(r => r.data),
  });
```

Expected shape per item:

```typescript
interface QuestionLogItem {
  id: string;
  question: string;
  answer: string | null;
  status: 'PENDING' | 'ANSWERED';
  sentAt: string;         // ISO 8601
  respondedAt: string | null;
}
```

---

### Member Portal

The member portal is a 4-page flow. Store the JWT from each step in memory or `sessionStorage` — **never `localStorage`**.

#### Page 1 — Link Validation (`/member/questions/access`)

On mount, extract `?token=` from the URL and call:

```typescript
const useValidateAccess = (token: string) =>
  useQuery({
    queryKey: ['portal', 'access', token],
    queryFn: () =>
      api.get(`/v1/member/questions/access`, { params: { token } }).then(r => r.data),
    retry: false,
  });
```

If `valid: true` → store the `token` in component state and navigate to the OTP page.
If the query errors → show "This link has expired or is invalid."

---

#### Page 2 — OTP Entry (`/member/questions/otp`)

**Send OTP on mount** (or via a "Resend" button):

```typescript
const useSendOtp = () =>
  useMutation({
    mutationFn: (token: string) =>
      api.post(`/v1/member/questions/send-otp`, { token }).then(r => r.data),
  });
```

**Verify OTP on form submit:**

```typescript
const useVerifyOtp = () =>
  useMutation({
    mutationFn: ({ token, otp }: { token: string; otp: string }) =>
      api.post(`/v1/member/questions/verify-otp`, { token, otp }).then(r => r.data),
    onSuccess: (data) => {
      // data.accessToken — store in memory/sessionStorage
      sessionStorage.setItem('portal_access_token', data.accessToken);
      navigate('/member/questions/answer');
    },
  });
```

Response shape:

```typescript
interface VerifyOtpResponse {
  accessToken: string; // 30-minute portal session JWT
}
```

---

#### Page 3 — Answer Questions (`/member/questions/answer`)

Retrieve the access token from sessionStorage and set it as the Authorization header.

```typescript
const portalApi = axios.create({ baseURL: '...' });
portalApi.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('portal_access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

**Fetch pending questions:**

```typescript
const usePendingQuestions = () =>
  useQuery({
    queryKey: ['portal', 'questions'],
    queryFn: () => portalApi.get(`/v1/member/questions`).then(r => r.data),
  });
```

Expected shape per item:

```typescript
interface PendingQuestion {
  id: string;
  question: string;
  sentAt: string; // ISO 8601
}
```

**Submit answers:**

```typescript
interface AnswerItem {
  questionId: number;
  answer: string;
}

const useSubmitAnswers = () =>
  useMutation({
    mutationFn: (answers: AnswerItem[]) =>
      portalApi.post(`/v1/member/questions/answers`, { answers }).then(r => r.data),
    onSuccess: () => {
      sessionStorage.removeItem('portal_access_token');
      navigate('/member/questions/confirmation');
    },
  });
```

Build the `answers` array from your form state, mapping each question's `id` (as a `number`) to the member's typed response.

---

#### Page 4 — Confirmation (`/member/questions/confirmation`)

Static page. Clear the portal token from sessionStorage. No API calls required.

---

### Token Lifecycle Summary

| Token            | Issued by                      | Expires | Storage      | Sent as                   |
|------------------|-------------------------------|---------|--------------|---------------------------|
| Access link JWT  | Backend (email link)           | 24h     | URL query param | `?token=` query string |
| Portal session   | `POST /verify-otp` response    | 30m     | sessionStorage | `Authorization: Bearer` |

---

### Error Handling Reference

| Status | Meaning                                  | User-facing message                            |
|--------|------------------------------------------|------------------------------------------------|
| 401    | Token invalid or expired                 | "This link has expired. Please contact your underwriter." |
| 401    | OTP invalid or expired                   | "Incorrect code or the code has expired. Please request a new one." |
| 401    | Portal session expired                   | "Your session has expired. Please start over." |
| 400    | Validation error (missing fields, etc.)  | Show field-level validation messages           |
| 404    | Enrollment not found                     | Generic error page                             |
