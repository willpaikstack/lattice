"use server";

import { saveAccountSettings, type AccountSettingsSnapshot } from "@/lib/account-settings";

export async function saveAccountSettingsAction(settings: AccountSettingsSnapshot) {
  await saveAccountSettings(settings);
}
