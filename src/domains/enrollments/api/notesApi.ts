import { z } from 'zod';

const API_BASE_V1 = import.meta.env.VITE_API_BASE_URL_V1;

const ApiNoteSchema = z.object({
  id: z.string(),
  noteText: z.string(),
  addedAt: z.string(),
  addedBy: z.object({
    userId: z.number(),
    name: z.string(),
  }),
});

const ApiNotesResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    success: z.boolean(),
    data: z.array(ApiNoteSchema),
  }),
});

export interface EnrollmentNote {
  id: string;
  text: string;
  author: string;
  date: string;
}

function mapApiNote(note: z.infer<typeof ApiNoteSchema>): EnrollmentNote {
  return {
    id: note.id,
    text: note.noteText,
    author: note.addedBy.name,
    date: note.addedAt,
  };
}

export async function fetchEnrollmentNotes(
  policyId: string,
  signal?: AbortSignal
): Promise<EnrollmentNote[]> {
  const res = await fetch(`${API_BASE_V1}/enrollments/${policyId}/notes`, {
    signal,
    credentials: 'include',
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch notes (${res.status}): ${errorText}`);
  }
  const raw = await res.json();
  return ApiNotesResponseSchema.parse(raw).data.data.map(mapApiNote);
}

export async function addEnrollmentNote(policyId: string, noteText: string): Promise<void> {
  const res = await fetch(`${API_BASE_V1}/enrollments/${policyId}/notes`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ noteText }),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to add note (${res.status}): ${errorText}`);
  }
}
