import "@testing-library/jest-dom/vitest";

// Tell React that Vitest is an environment where updates are flushed through
// Testing Library's `act` helpers. This keeps async component tests from
// emitting the "not configured to support act(...)" warning.
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
