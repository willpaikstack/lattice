import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { customerMaterialCatalog } from "@/lib/customer-material-catalog";
import { getDirectoryMechanicalProperties } from "@/lib/material-grade-properties";
import { MaterialGradeDirectory } from "./material-grade-directory";

const groups = [
  { name: "5000 series", grades: ["5052 Aluminum"] },
  {
    name: "6000 series",
    grades: ["6060 Aluminum", "6063 Aluminum", "6082 Aluminum"],
    conditionsByGrade: {
      "6060 Aluminum": [{ grade: "6060-T6 Aluminum", label: "T6" }],
      "6063 Aluminum": [{ grade: "6063-T5 Aluminum", label: "T5" }, { grade: "6063-T6 Aluminum", label: "T6" }],
      "6082 Aluminum": [{ grade: "6082-T651 Aluminum", label: "T651" }],
    },
  },
];

describe("MaterialGradeDirectory", () => {
  it("renders the selected series and expanded subcard", () => {
    render(<MaterialGradeDirectory familyName="Aluminum" groups={groups} totalCount={4} />);

    expect(screen.getByRole("heading", { name: "All aluminum offerings" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /6063 UNS A96063/ })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByLabelText("6063 available conditions")).toHaveTextContent("T5");
    expect(screen.getByLabelText("6063 available conditions")).toHaveTextContent("T6");
    expect(screen.getByText("Selection guidance")).toBeInTheDocument();
    expect(screen.getByText("Reference mechanical properties")).toBeInTheDocument();
    expect(screen.getAllByText("145 MPa")).toHaveLength(2);
    expect(screen.getAllByText("186 MPa")).toHaveLength(2);
    expect(screen.getByText("UNS A96060")).toBeInTheDocument();
    expect(screen.getByText("UNS A96063")).toBeInTheDocument();
    expect(screen.getByText("UNS A96082")).toBeInTheDocument();
    expect(screen.queryByText("Designation as listed")).not.toBeInTheDocument();
    expect(screen.queryByText("Add to comparison")).not.toBeInTheDocument();
    expect(screen.queryByText("Request this grade")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "T6" }));
    expect(screen.getByText("T6 typical values")).toBeInTheDocument();
    expect(screen.getAllByText("214 MPa")).toHaveLength(2);
    expect(screen.getAllByText("241 MPa")).toHaveLength(2);
    expect(screen.getByText("Alliance 6063-T6 data sheet")).toBeInTheDocument();
  });

  it("has a sourced property record for every supported aluminum condition", () => {
    const aluminum = customerMaterialCatalog.find((material) => material.slug === "aluminum");
    const conditions = aluminum?.materialGroups.flatMap((group) => group.grades.flatMap((grade) => group.conditionsByGrade?.[grade] ?? [])) ?? [];

    expect(conditions).not.toHaveLength(0);
    expect(conditions.filter((condition) => !getDirectoryMechanicalProperties("Aluminum", condition.grade)).map((condition) => condition.grade)).toEqual([]);
  });

  it("has a source-backed reference row for every aluminum offering", () => {
    const aluminum = customerMaterialCatalog.find((material) => material.slug === "aluminum");
    const offerings = aluminum?.materialGroups.flatMap((group) => group.grades) ?? [];
    const conditionsByOffering = Object.fromEntries(aluminum?.materialGroups.flatMap((group) => Object.entries(group.conditionsByGrade ?? {})) ?? []);

    expect(offerings).toHaveLength(21);
    expect(offerings.filter((offering) => !getDirectoryMechanicalProperties("Aluminum", offering) && !(conditionsByOffering[offering] ?? []).some((condition) => getDirectoryMechanicalProperties("Aluminum", condition.grade)))).toEqual([]);
  });

  it("uses a stated reference condition for aluminum offerings without a supplier-listed temper", () => {
    render(<MaterialGradeDirectory familyName="Aluminum" groups={[{ name: "1000 series", grades: ["1070 Aluminum"] }]} totalCount={1} />);

    fireEvent.click(screen.getByRole("button", { name: /1000 series/ }));
    fireEvent.click(screen.getByRole("button", { name: /1070/ }));
    expect(screen.getByText("H14 wrought reference")).toBeInTheDocument();
    expect(screen.getAllByText("74 MPa")).toHaveLength(2);
    expect(screen.getAllByText("Not published")).toHaveLength(2);
  });

  it("opens and closes a grade series", () => {
    render(<MaterialGradeDirectory familyName="Aluminum" groups={groups} totalCount={4} />);

    const seriesButton = screen.getByRole("button", { name: /5000 series/ });
    expect(seriesButton).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(seriesButton);
    expect(seriesButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: /5052/ })).toBeInTheDocument();
  });

  it("uses researched stainless machining profiles instead of an unsupported fallback", () => {
    render(<MaterialGradeDirectory familyName="Stainless steel" groups={[{ name: "300 series austenitic", grades: ["304 Stainless Steel", "303 Stainless Steel"] }, { name: "Duplex and super duplex", grades: ["Duplex 2205 / S31803"] }]} totalCount={3} />);

    expect(screen.getByRole("button", { name: /303 Stainless Steel/ })).toHaveTextContent("Good");
    expect(screen.getByRole("button", { name: /304 Stainless Steel/ })).toHaveTextContent("Fair");
    fireEvent.click(screen.getByRole("button", { name: /Duplex and super duplex/ }));
    expect(screen.getByRole("button", { name: /Duplex 2205/ })).toHaveTextContent("Difficult");
    expect(screen.queryByText("Unspecified")).not.toBeInTheDocument();
  });

  it("uses condition-aware mild-steel machinability ratings", () => {
    render(<MaterialGradeDirectory familyName="Mild steel" groups={[{ name: "Plain carbon steels", grades: ["1018 Steel", "Steel 1020", "Steel 1045 / 45#"] }]} totalCount={3} />);

    expect(screen.getByRole("button", { name: /1018 Steel/ })).toHaveTextContent("Good");
    expect(screen.getByRole("button", { name: /Steel 1020/ })).toHaveTextContent("Good");
    expect(screen.getByRole("button", { name: /Steel 1045/ })).toHaveTextContent("Fair");
  });

  it("uses stated source conditions for the newly researched steel records", () => {
    expect(getDirectoryMechanicalProperties("Mild steel", "44W Steel")).toMatchObject({
      condition: "CSA 44WT plate, 2.54–63.5 mm",
      yieldStrength: "≥303 MPa",
      sourceLabel: "SSAB CSA 44WT product data",
    });
    expect(getDirectoryMechanicalProperties("Alloy steel", "1.6580 / 30CrNiMo8 Alloy Steel")).toMatchObject({
      condition: "Quenched and tempered, ≤16 mm",
      tensileStrength: "1,250–1,450 MPa",
      sourceLabel: "Hillfoot 30CrNiMo8 / 1.6580 data sheet",
    });
    expect(getDirectoryMechanicalProperties("Tool steel", "Steel 1.2085")).toMatchObject({
      condition: "Prehardened plate",
      hardness: "280–325 HB",
      sourceLabel: "HABA 1.2085 product data",
    });
  });

  it("resolves a supplier alias to a condition-specific property record and leaves unmatched labels blank", () => {
    render(<MaterialGradeDirectory familyName="Stainless steel" groups={[{ name: "300 series austenitic", grades: ["304 Stainless Steel", "SS 300 series"] }]} totalCount={2} />);

    fireEvent.click(screen.getByRole("button", { name: /304 Stainless Steel/ }));
    expect(screen.getByText("Outokumpu Core range data sheet")).toBeInTheDocument();
    expect(screen.getAllByText("515 MPa")).toHaveLength(2);

    expect(getDirectoryMechanicalProperties("Stainless steel", "SS 300 series")).toBeUndefined();
  });

  it("shows plastic functional traits directly in each directory card without a grade dropdown", () => {
    render(<MaterialGradeDirectory familyName="Plastics / polymers" groups={[{ name: "Engineering thermoplastics", grades: ["PEEK"] }]} totalCount={1} />);

    expect(screen.queryByText("Reference mechanical properties")).not.toBeInTheDocument();
    expect(screen.getByText("Heat tolerance:")).toBeInTheDocument();
    expect(screen.getByText("Moisture response:")).toBeInTheDocument();
    expect(screen.getByText("Chemical resistance:")).toBeInTheDocument();
    expect(screen.getByText("Wear / friction:")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /PEEK/ })).not.toBeInTheDocument();
    expect(screen.queryByText("Typical applications")).not.toBeInTheDocument();
  });
});
