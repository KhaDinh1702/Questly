/**
 * Next route after auth, based on class/path onboarding progress.
 * Skip warden-intro when the user already has a confirmed class.
 */
export function getPostAuthRoute(me) {
  const hasClass = Boolean(me?.classProfile?.confirmedClass);
  const hasPath = Boolean(me?.pathProfile?.confirmedPath);
  if (!hasClass) return '/warden-intro';
  if (!hasPath) return '/path-selection';
  return '/';
}
