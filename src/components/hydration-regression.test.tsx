import { act } from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { deleteBuyerQuoteAction } from "@/app/quotes/actions";
import { buildDraftRequest, type LatticeRequest } from "@/lib/request-model";

import { BuyerQuotes } from "./buyer-quotes";
import { RequestForm } from "./request-form";

const routerPushMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: routerPushMock,
  }),
}));

vi.mock("@/app/quotes/actions", () => ({
  deleteBuyerQuoteAction: vi.fn(async () => undefined),
}));

const incompleteRfqStorageKey = "lattice.incompleteRfqs.v1";

function localDraft(title: string): LatticeRequest {
  return {
    ...buildDraftRequest({
      buyerCompany: "Hydration Test Co.",
      dueDate: "2026-08-18",
      files: [],
      lineItems: [
        {
          material: "SS 304",
          partName: "Hydration bracket",
          quantity: 1,
        },
      ],
      process: "CNC milling",
      requesterName: "Hydration Tester",
      title,
    }),
    id: `local_draft_${title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
    status: "DRAFT",
  };
}

function serverRender(ui: React.ReactElement) {
  // JSDOM exposes window during tests. Remove it while rendering so this has
  // the same browser-storage boundary as a real server render.
  vi.stubGlobal("window", undefined);

  try {
    return renderToString(ui);
  } finally {
    vi.unstubAllGlobals();
  }
}

async function hydrateWithStorage(
  ui: React.ReactElement,
  storageValue: unknown,
) {
  const serverHtml = serverRender(ui);
  const container = document.createElement("div");
  container.innerHTML = serverHtml;
  document.body.append(container);
  window.localStorage.setItem(incompleteRfqStorageKey, JSON.stringify(storageValue));
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);

  const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
  let root: Root | undefined;

  await act(async () => {
    root = hydrateRoot(container, ui);
    await Promise.resolve();
  });

  return {
    consoleError,
    container,
    root: root!,
    serverHtml,
  };
}

describe("browser-storage hydration regressions", () => {
  afterEach(async () => {
    window.localStorage.clear();
    routerPushMock.mockClear();
    vi.mocked(deleteBuyerQuoteAction).mockClear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it("hydrates the buyer quote list before adding browser-only draft rows", async () => {
    const draft = localDraft("Browser-only quote draft");
    const result = await hydrateWithStorage(<BuyerQuotes requests={[]} />, [
      { id: draft.id, request: draft },
    ]);

    expect(result.serverHtml).not.toContain(draft.title);
    expect(result.container).toHaveTextContent(draft.title);
    expect(result.consoleError).not.toHaveBeenCalled();

    await act(async () => result.root.unmount());
  });

  it("hydrates the RFQ form before adding browser-only continuation drafts", async () => {
    const draft = localDraft("Browser-only RFQ draft");
    const result = await hydrateWithStorage(<RequestForm />, [
      {
        id: draft.id,
        initialState: {
          dueDate: "2026-08-18",
          partName: "Hydration bracket",
          projectName: draft.title,
        },
        request: draft,
        updatedAt: "2026-08-18T12:00:00.000Z",
      },
    ]);

    expect(result.serverHtml).not.toContain(draft.title);
    expect(result.container).toHaveTextContent(draft.title);
    expect(result.consoleError).not.toHaveBeenCalled();

    await act(async () => result.root.unmount());
  });
});
