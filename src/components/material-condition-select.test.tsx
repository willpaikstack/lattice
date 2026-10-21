import { useState } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MaterialConditionSelect } from "./material-condition-select";

function Picker({ initial = "" }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return <MaterialConditionSelect value={value} onChange={setValue} />;
}
function search(query: string) {
  fireEvent.click(screen.getByRole("button", { name: "Material dropdown" }));
  fireEvent.change(screen.getByRole("combobox", { name: "Search materials" }), { target: { value: query } });
  return screen.getByRole("listbox", { name: "Material grades" });
}

describe("Material and Condition selection", () => {
  it("fills both fields from an exact temper search and restores trigger focus", () => {
    render(<Picker />);
    const results = search("6061-T651");
    fireEvent.click(within(results).getByRole("option", { name: /6061 · T651/ }));
    expect(screen.getByRole("button", { name: "Material dropdown" })).toHaveTextContent("6061");
    expect(screen.getByLabelText("Condition")).toHaveDisplayValue("T651");
    expect(screen.getByLabelText("Material")).toHaveValue("6061_t651_aluminum");
    expect(screen.getByRole("button", { name: "Material dropdown" })).toHaveFocus();
    fireEvent.change(screen.getByLabelText("Condition"), { target: { value: "al_6061_t6" } });
    expect(screen.getByLabelText("Condition")).toHaveDisplayValue("T6");
    expect(screen.getByLabelText("Material")).toHaveValue("al_6061_t6");
  });

  it("requires a deliberate condition choice when choosing the parent alloy", () => {
    render(<Picker />);
    fireEvent.click(within(search("6061")).getByRole("option", { name: "6061 Aluminum" }));
    expect(screen.getByLabelText("Condition")).toHaveDisplayValue("Select a condition");
    expect(screen.getByText("Choose the condition required by your drawing.")).toBeInTheDocument();
  });

  it("restores legacy exact choices and presents catalog-only materials with a sourcing action", () => {
    render(<Picker initial="al_6061_t6" />);
    expect(screen.getByLabelText("Condition")).toHaveDisplayValue("T6");
    fireEvent.click(within(search("321")).getByRole("option", { name: "321 Sourcing review required" }));
    expect(screen.getByRole("link", { name: /Ask us to source this material/ })).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("button", { name: "Material dropdown" })).toHaveTextContent("321");
  });
});
