/** The parts of a user object needed to build a display label. */
export interface UserDisplaySource {
  displayName?: string | null;
  email?: string | null;
}

/**
 * Preferred label for a user: display name, then email local part.
 * Works with a live Firebase user as well as the cached localStorage copy.
 */
export function userDisplayName(
  user: UserDisplaySource | null | undefined
): string {
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
