import { useAuth } from '@/app/providers/AuthContext';
import type { SsoUser } from '@/domains/auth/types';

function deriveUserDisplay(user: SsoUser | null) {
  const fullName = [user?.first_name ?? user?.firstName, user?.last_name ?? user?.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();
  return {
    displayName: (user?.name ?? fullName) || 'Underwriting User',
    email: user?.email ?? 'N/A',
  };
}

export function useCurrentUser() {
  const { user } = useAuth();
  return deriveUserDisplay(user);
}
