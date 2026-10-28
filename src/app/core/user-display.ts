import { User as FirebaseUser } from 'firebase/auth';

/** Preferred label for a Firebase user: display name, then email local part. */
export function userDisplayName(user: FirebaseUser | null): string {
  if (!user) {
    return '';
  }
  return user.displayName?.trim() || user.email?.split('@')[0] || 'User';
}

/** One or two uppercase letters derived from a display name. */
export function userInitials(name: string): string {
  const parts = name.split(/[\s._-]+/).filter(Boolean);
  const initials = parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
  return initials || '?';
}
