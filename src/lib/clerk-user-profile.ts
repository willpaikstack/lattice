type ClerkProfile = {
  firstName?: string | null;
  fullName?: string | null;
  primaryEmailAddress?: { emailAddress?: string | null } | null;
  username?: string | null;
};

function normalized(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed || null;
}

export function clerkUserDisplayName(user: ClerkProfile | null | undefined) {
  const fullName = normalized(user?.fullName);
  if (fullName) return fullName;

  const firstName = normalized(user?.firstName);
  if (firstName) return firstName;

  const username = normalized(user?.username);
  if (username) return username;

  const email = normalized(user?.primaryEmailAddress?.emailAddress);
  return email?.split("@", 1)[0] || null;
}
