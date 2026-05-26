import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RequestForm } from "./request-form";

describe("RequestForm", () => {
  it("emulates Bubble's upload-first RFQ intake without debug placeholder text", () => {
    render(<RequestForm />);

    expect(screen.getByText("Drag & drop CAD files here, or browse")).toBeInTheDocument();
    expect(screen.getByText(/STEP, STP, IGES, IGS, SLDPRT, SAT, X_T, X_B, IPT/)).toBeInTheDocument();
    expect(screen.getByLabelText("Customer PO#")).toBeInTheDocument();
    expect(screen.getByLabelText("Company Name")).toBeInTheDocument();
    expect(screen.getByLabelText(/Project Name/)).toBeInTheDocument();
    expect(screen.getByLabelText("Material")).toHaveDisplayValue("SS 304");
    expect(screen.getByLabelText("General tolerance")).toHaveDisplayValue("ISO 2768 Medium (m)");
    expect(screen.getByLabelText("Surface finish")).toHaveDisplayValue("As machined (Ra 3.2 um / Ra 126 uin)");
    expect(screen.getByText("Quality documentation")).toBeInTheDocument();
    expect(screen.getByLabelText("Standard Inspection")).toBeChecked();
    expect(screen.queryByText("HEADER")).not.toBeInTheDocument();
    expect(screen.queryByText("yes(No quote line items)")).not.toBeInTheDocument();
  });
});
