/** Real customer workspace locations. No sample records or workflow mutations. */
export const WORKSPACE_TOUR_LAST_STEP = 5;
// Keep the completion state/code separate from the five numbered guide steps.
export const WORKSPACE_TOUR_COMPLETION_SCREEN = WORKSPACE_TOUR_LAST_STEP + 1;
const PROGRESS_OFFSET = 400;

export const workspaceTourChapters = [
  { label: "Request Quote", step: 1, end: 2 },
  { label: "Quotes", step: 3, end: 3 },
  { label: "Orders", step: 4, end: 4 },
  { label: "Your Resources", step: 5, end: 5 },
] as const;

export const workspaceTourSteps = [
  { title: "Welcome to your workspace", text: "A quick introduction to the tools you’ll use to request quotes and follow your work.", selector: "", path: "/dashboard", nextLabel: "Show me around", clickToAdvance: false },
  { title: "Start a quote request.", text: "Use Request Quote to send us a part for pricing. You can include CAD files and drawings with your request.", selector: 'a[href="/requests/new"]', path: "/dashboard", nextLabel: "Next", clickToAdvance: true },
  { title: "Build your manufacturing request", text: "Add your CAD files, then define the requirements for each part.", selector: '[data-workspace-tour="request-files"], [data-workspace-tour="request-form"]', path: "/requests/new", nextLabel: "Next", clickToAdvance: false },
  { title: "Manage your requests", text: "You'll find your submitted requests and issued quotes here. When a quote is ready, open it to review the offering from the lattice manufacturing network. An empty list is normal when you’re just getting started.", selector: 'a[href="/quotes"]', path: "/quotes", nextLabel: "Next", clickToAdvance: false },
  { title: "Track work after you place an order.", text: "The Orders page will contain all active production activity and delivery updates.", selector: 'a[href="/orders"]', path: "/orders", nextLabel: "Next", clickToAdvance: false },
  { title: "Explore Your Resources.", text: "Your Resources is your reference library: browse How Lattice works, Capabilities, Materials, Equipment, and Inspection & Certificates. Use these pages to compare materials and documented capacity, understand quality options, and learn how Lattice handles your work.", selector: '[data-workspace-tour="resources"]', path: "/orders", nextLabel: "Finish", clickToAdvance: false },
  { title: "You’re ready to get started.", text: "Contact our team, replay this introduction, or finish the tour and start using your workspace.", selector: "", path: "/orders", nextLabel: "Finish tour", clickToAdvance: false },
] as const;

export function encodeWorkspaceTourStep(step: number) { return PROGRESS_OFFSET + step; }

export function decodeWorkspaceTourStep(stored: number) {
  if (stored >= PROGRESS_OFFSET && stored <= PROGRESS_OFFSET + WORKSPACE_TOUR_COMPLETION_SCREEN) return stored - PROGRESS_OFFSET;
  // Keep earlier final-screen progress mapped to the unnumbered completion popup.
  if (stored >= 300 && stored <= 306) return [0, 1, 2, 3, 4, WORKSPACE_TOUR_COMPLETION_SCREEN, WORKSPACE_TOUR_COMPLETION_SCREEN][stored - 300];
  // Map the previous eight-step tour onto five guided steps and the completion popup.
  if (stored >= 200 && stored <= 208) return [0, 1, 2, 3, 3, 4, 4, 6, 6][stored - 200];
  // Preserve progress from both earlier implementations, without enrolling finished users again.
  if (stored >= 100 && stored <= 112) return [0, 1, 2, 2, 3, 3, 3, 4, 4, 4, 4, 6, 6][stored - 100];
  return [0, 1, 3, 4, WORKSPACE_TOUR_COMPLETION_SCREEN][stored] ?? 0;
}

export function isValidWorkspaceTourProgress(step: number) {
  return Number.isInteger(step) && ((step >= 0 && step <= 4) || (step >= 100 && step <= 112) || (step >= 200 && step <= 208) || (step >= 300 && step <= 306) || (step >= PROGRESS_OFFSET && step <= PROGRESS_OFFSET + WORKSPACE_TOUR_COMPLETION_SCREEN));
}
