export type LatticeDataMode = "customer" | "mock";

const dataModes = new Set<LatticeDataMode>(["customer", "mock"]);

export function getLatticeDataMode(): LatticeDataMode {
  const configured = process.env.LATTICE_DATA_MODE?.trim().toLowerCase();
  const mode = configured || (process.env.NODE_ENV === "development" ? "mock" : "customer");

  if (!dataModes.has(mode as LatticeDataMode)) {
    throw new Error("LATTICE_DATA_MODE must be either 'customer' or 'mock'.");
  }

  if (process.env.NODE_ENV === "production" && mode === "mock") {
    throw new Error("Mock data mode cannot run in production.");
  }

  return mode as LatticeDataMode;
}

export function isMockDataMode() {
  return getLatticeDataMode() === "mock";
}
