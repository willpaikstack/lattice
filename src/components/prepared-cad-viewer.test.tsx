import { useEffect } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PreparedCadModelHost } from "./prepared-cad-viewer";

const lifecycle = vi.hoisted(() => ({ start: vi.fn(), finish: vi.fn() }));
vi.mock("./autodesk-model-viewer", () => ({
  AutodeskModelViewer: ({ urn }: { urn: string }) => {
    useEffect(() => { lifecycle.start(urn); return () => lifecycle.finish(urn); }, [urn]);
    return <div data-testid="prepared-model">{urn}</div>;
  },
}));
afterEach(() => { cleanup(); document.querySelectorAll("[data-test-slot]").forEach(node => node.remove()); vi.clearAllMocks(); });

describe("prepared CAD viewer handoff", () => {
  it("moves the existing model into Configure without remounting it", () => {
    const onMetadata = vi.fn();
    const view = render(<PreparedCadModelHost urn="sample-model" target={null} onMetadata={onMetadata} />);
    const original = screen.getByTestId("prepared-model");
    expect(original.parentElement?.inert).toBe(true);
    const target = document.createElement("div"); target.dataset.testSlot = "configure"; document.body.appendChild(target);
    view.rerender(<PreparedCadModelHost urn="sample-model" target={target} onMetadata={onMetadata} />);
    expect(target.contains(original)).toBe(true);
    expect(screen.getByTestId("prepared-model")).toBe(original);
    expect(original.parentElement?.inert).toBe(false);
    expect(lifecycle.start).toHaveBeenCalledOnce();
    expect(lifecycle.finish).not.toHaveBeenCalled();
    view.unmount();
    expect(lifecycle.finish).toHaveBeenCalledOnce();
    expect(target).toBeEmptyDOMElement();
  });

  it("disposes a prepared model when its canceled selection unmounts", () => {
    const view = render(<PreparedCadModelHost urn="canceled-model" target={null} onMetadata={vi.fn()} />);
    const original = screen.getByTestId("prepared-model");
    view.unmount();
    expect(lifecycle.finish).toHaveBeenCalledOnce();
    expect(original.isConnected).toBe(false);
  });
});
