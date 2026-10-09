import { createRoot } from "react-dom/client";
import { CustomerOnboardingDraft } from "../../src/components/customer-onboarding-draft";

createRoot(document.getElementById("root")!).render(<CustomerOnboardingDraft workspacePreviewUrl="http://localhost:3000/customer-onboarding-workspace" />);
