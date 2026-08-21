"use server";

import { revalidatePath } from "next/cache";
import { auth, clerkClient } from "@clerk/nextjs/server";

import { deferInitialAddressOnboarding, saveAccountSettings } from "@/lib/account-settings";
import type { AccountSettingsSnapshot } from "@/lib/account-settings-shared";
import { clerkUserDisplayName } from "@/lib/clerk-user-profile";
import { findWorkspaceUserByClerkUserId, syncWorkspaceUserName } from "@/lib/workspace-user";

function profileNameParts(value: string) {
  const name = value.trim().replace(/\s+/g, " ");
  if (!name || name.length > 120) {
    throw new Error("Enter a name between 1 and 120 characters.");
  }

  const [firstName, ...lastNameParts] = name.split(" ");
  return { firstName, lastName: lastNameParts.join(" ") };
}

export async function updateAccountDisplayNameAction(value: string) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Authentication required.");
  }

  const client = await clerkClient();
  const clerkUser = await client.users.updateUser(userId, profileNameParts(value));
  const name = clerkUserDisplayName(clerkUser);
  if (!name) {
    throw new Error("Clerk did not return an updated display name.");
  }

  const workspaceUser = await findWorkspaceUserByClerkUserId(userId);
  if (workspaceUser) {
    await syncWorkspaceUserName(workspaceUser.id, name);
  }

  revalidatePath("/account/settings");
  revalidatePath("/dashboard");
  return { name };
}

export async function saveAccountSettingsAction(settings: AccountSettingsSnapshot) {
  return saveAccountSettings(settings);
}

export async function deferInitialAddressOnboardingAction() {
  await deferInitialAddressOnboarding();
  revalidatePath("/account/settings");
  revalidatePath("/account/continue");
  revalidatePath("/dashboard");
}
