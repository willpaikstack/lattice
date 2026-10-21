import { useState } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { materialOfferingFor, materialSelectionError } from "@/lib/material-quote-offerings";
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

describe("Single material requirement selection", () => {
  it("selects an exact temper and restores trigger focus", () => {
    render(<Picker />);
    const results = search("6061-T651");
    fireEvent.click(within(results).getByRole("option", { name: /6061-T651 Aluminum/ }));
    expect(screen.getByRole("button", { name: "Material dropdown" })).toHaveTextContent("6061");
    expect(screen.queryByLabelText("Condition")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Material")).toHaveValue("6061_t651_aluminum");
    expect(screen.getByRole("button", { name: "Material dropdown" })).toHaveFocus();
    fireEvent.click(within(search("6061-T6")).getByRole("option", { name: /6061-T6 Aluminum/ }));
    expect(screen.getByRole("button", { name: "Material dropdown" })).toHaveTextContent("6061-T6 Aluminum");
    expect(screen.getByLabelText("Material")).toHaveValue("al_6061_t6");
  });

  it("requires an exact requirement for a saved alloy parent without adding another control", () => {
    render(<Picker initial={materialOfferingFor("al_6061_t6")!.value} />);
    expect(screen.queryByLabelText("Condition")).not.toBeInTheDocument();
    expect(screen.getByText("Choose the material and temper required by your drawing from the material dropdown.")).toBeInTheDocument();
    const options = search("6061");
    expect(within(options).queryByRole("option", { name: "6061 Aluminum" })).not.toBeInTheDocument();
    fireEvent.click(within(options).getByRole("option", { name: /6061-T6 Aluminum/ }));
    expect(screen.getByLabelText("Material")).toHaveValue("al_6061_t6");
  });

  it("restores legacy choices and retains sourcing-only choices plus the Other path", () => {
    render(<Picker initial="al_6061_t6" />);
    expect(screen.getByLabelText("Material")).toHaveValue("al_6061_t6");
    fireEvent.click(within(search("321")).getByRole("option", { name: /321 Stainless Steel Sourcing review required/ }));
    const selected = (screen.getByLabelText("Material") as HTMLSelectElement).value;
    expect(materialSelectionError(selected)).toMatch(/sourcing review/);
    expect(screen.getByRole("button", { name: "Material dropdown" })).toHaveTextContent("321 Stainless Steel");
    expect(screen.queryByRole("link", { name: /Ask us to source this material/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Material dropdown" }));
    fireEvent.click(screen.getByRole("button", { name: "Select Other" }));
    expect(screen.getByLabelText("Material")).toHaveValue("other_material");
  });
});
