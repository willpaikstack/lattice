export const platformUserRoleLabels = {
  LATTICE_ADMIN: "Lattice Admin",
  CUSTOMER_ADMIN: "Customer Admin",
  CUSTOMER_MEMBER: "Customer Member",
} as const;

export type PlatformUser = {
  id: string;
  name: string;
  email: string;
  role: keyof typeof platformUserRoleLabels;
  company: { id: string; name: string } | null;
  signInSetup: "Connected" | "Setup required" | "Setup expired" | "Not connected";
  createdAt: string;
};
