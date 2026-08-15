import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HowItWorksPage from "./page";

describe("How it works page", () => {
  it("explains the managed-capacity workflow without exposing a public RFQ action", () => {
    render(<HowItWorksPage />);

    expect(screen.getByRole("heading", { name: "How Lattice works" })).toBeInTheDocument();
    expect(screen.getByText(/Lattice gives domestic manufacturers access to qualified global production capacity/i)).toBeInTheDocument();
    expect(screen.getByText("01 · The problem")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Demand is growing faster than shop capacity." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "More customer demand. Not enough productive capacity." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Global capacity exists. Making it trustworthy is the hard part." })).toBeInTheDocument();
    expect(screen.getByText("02 · The solution")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Add capacity without building it yourself." })).toBeInTheDocument();
    expect(screen.getByText(/Lattice gives manufacturers another production path when internal capacity is constrained/i)).toBeInTheDocument();
    expect(screen.getByText("How Lattice delivers", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByText(/cannot fit the schedule or available capacity/i)).toBeInTheDocument();
    expect(screen.getByText(/Finding a supplier is only the first step. Knowing whether it can consistently meet your drawings/i)).toBeInTheDocument();
    expect(screen.getByText(/Lattice handles the work required to make global capacity usable/i)).toBeInTheDocument();
    expect(screen.getByText("Demand exists. Customers are ready to buy. But the capacity to fulfill that demand does not.")).toHaveClass("font-semibold");
    expect(screen.getByText("You get access to additional capacity without having to build and manage an overseas supply chain yourself.")).toHaveClass("font-semibold");
    expect(screen.getByRole("heading", { name: "Submit a complete manufacturing package" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "We validate the production path" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Approve the quote and launch production" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Review quality before shipment" })).toBeInTheDocument();
    expect(screen.queryByText("Start with the technical information needed to evaluate the work properly.")).not.toBeInTheDocument();
    expect(screen.queryByText("Lattice reviews the work before asking suppliers to quote.")).not.toBeInTheDocument();
    expect(screen.queryByText("Keep your own floor focused on the work already committed to it.")).not.toBeInTheDocument();
    expect(screen.queryByText("See the quality evidence required for your job before parts move.")).not.toBeInTheDocument();
    expect(screen.getByText(/multi-part RFQ can be managed as one project without losing technical specificity/i)).toBeInTheDocument();
    expect(screen.getByText(/supplier-backed quote—not an automated estimate/i)).toBeInTheDocument();
    expect(screen.getByText(/clear record of the order from release through delivery/i)).toBeInTheDocument();
    expect(screen.getByText(/shipment will be held until the substantiation documents are approved/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Where to start with Lattice" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "More capacity. Less infrastructure to manage." })).toBeInTheDocument();
    expect(screen.getByText("More capacity")).toBeInTheDocument();
    expect(screen.getByText("One accountable partner")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Access global manufacturing capacity without building the supply chain yourself." })).toBeInTheDocument();
    expect(screen.getByText(/qualification, process validation, material coordination, quality control, communication, and logistics/i)).toBeInTheDocument();
    expect(screen.getByText("We learned this firsthand.")).toHaveClass("font-semibold");
    expect(screen.getByText(/disqualifying prospective suppliers that could not demonstrate the quality systems, process controls, and execution discipline/i)).toBeInTheDocument();
    expect(screen.getByText(/augment and fortify our domestic manufacturing team's ability to meet customer requirements/i)).toBeInTheDocument();
    expect(screen.getByText("Lattice helps domestic manufacturers stay strong: keep customer relationships, protect internal capacity, and accept more of the work they are already winning.")).toHaveClass("font-semibold");
    for (const accessLink of screen.getAllByRole("link", { name: "Request access" })) {
      expect(accessLink).toHaveAttribute("href", "/waiting-list");
    }
    expect(screen.queryByRole("link", { name: /quote/i })).not.toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "On this page" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "The problem" })).toHaveAttribute("href", "#problem");
    expect(screen.getByRole("link", { name: "Demand pressure" })).toHaveAttribute("href", "#the-problem");
    expect(screen.getByRole("link", { name: "The solution" })).toHaveAttribute("href", "#solution");
    expect(screen.getByRole("link", { name: "Submit a manufacturing package" })).toHaveAttribute("href", "#share-your-work");
    expect(screen.getByRole("link", { name: "Validate the production path" })).toHaveAttribute("href", "#align-production-plan");
    expect(screen.getByRole("link", { name: "Approve and launch production" })).toHaveAttribute("href", "#production-coordination");
    expect(screen.getByRole("link", { name: "Network reach" })).toHaveAttribute("href", "#network");
    expect(screen.getByRole("link", { name: "Why Lattice exists" })).toHaveAttribute("href", "#why-lattice");
    expect(screen.getByText(/Pins indicate locations of partner manufacturers/i)).toBeInTheDocument();
    expect(screen.queryByText("Verified network cities")).not.toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Verified network cities" })).not.toBeInTheDocument();

    const capacityConstraints = screen.getByText(/cannot fit the schedule or available capacity/i);
    const expansionConstraints = screen.getByText(/Adding capacity is not simple/i);
    expect(capacityConstraints.compareDocumentPosition(expansionConstraints) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    const firstJob = screen.getByRole("heading", { name: "Where to start with Lattice" });
    const workflow = screen.getByText("How Lattice delivers", { selector: "p" });
    expect(firstJob.compareDocumentPosition(workflow) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    const originStory = screen.getByRole("heading", { name: "Access global manufacturing capacity without building the supply chain yourself." });
    const accessRequest = screen.getAllByRole("link", { name: "Request access" }).at(-1);
    expect(accessRequest).toBeDefined();
    expect(originStory.compareDocumentPosition(accessRequest!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(accessRequest).toHaveAttribute("href", "/waiting-list");
  });

  it("reveals one Lattice benefit at a time", () => {
    render(<HowItWorksPage />);

    const capacityButton = screen.getByRole("button", { name: /More capacity.*Take on overflow work without reshuffling your own production schedule/i });
    const onDemandButton = screen.getByRole("button", { name: /Capacity on demand.*without a long-term volume commitment/i });
    const qualityButton = screen.getByRole("button", { name: /Managed quality.*Suppliers are vetted, qualified for the job/i });

    expect(capacityButton).toHaveAttribute("aria-expanded", "false");
    expect(qualityButton).toHaveAttribute("aria-expanded", "false");
    expect(onDemandButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText(/212 documented CNC machines across the partner network/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/The network gives Lattice another qualified production path/i)).not.toBeInTheDocument();

    fireEvent.click(capacityButton);

    expect(capacityButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("212")).toBeInTheDocument();
    expect(screen.getByText("192 / 20")).toBeInTheDocument();
    expect(screen.getByText("82")).toBeInTheDocument();
    expect(screen.getByText(/Listed envelopes extend to 3000 × 2200 × 1100 mm for milling/i)).toBeInTheDocument();
    expect(screen.getByText(/212 documented CNC machines across the partner network support 3-, 4-, and 5-axis milling/i)).toBeInTheDocument();
    expect(screen.getByText(/combined workforce of 400\+ across the partner network spans machining, quality control, shipping and receiving/i)).toBeInTheDocument();
    expect(screen.getByText(/12 documented CMMs across the partner network, plus 2D\/2.5D vision, X-ray fluorescence \(XRF\), roughness, hardness, and ultrasonic inspection capability/i)).toBeInTheDocument();
    expect(screen.getByText(/traceability controls from incoming material through finished goods/i)).toBeInTheDocument();
    expect(screen.queryByText(/equipment records across 9 process categories/i)).not.toBeInTheDocument();

    fireEvent.click(onDemandButton);

    expect(capacityButton).toHaveAttribute("aria-expanded", "false");
    expect(onDemandButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/move it directly into qualified CNC capacity without waiting for a new machine/i)).toBeInTheDocument();
    expect(screen.getByText(/Release work job by job, with each quote matched to the drawing, material, quantity, quality, and delivery requirements/i)).toBeInTheDocument();
    expect(screen.getByText(/Scale outsourced production up for demand peaks and back down when the backlog clears/i)).toBeInTheDocument();
    expect(screen.getByText(/Use outsourcing as variable production capacity/i)).toBeInTheDocument();

    fireEvent.click(qualityButton);

    expect(capacityButton).toHaveAttribute("aria-expanded", "false");
    expect(onDemandButton).toHaveAttribute("aria-expanded", "false");
    expect(qualityButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.queryByText(/212 documented CNC machines across the partner network/i)).not.toBeInTheDocument();
    expect(screen.getByText("Vet the supplier")).toBeInTheDocument();
    expect(screen.getByText(/conducting onsite facility visits, auditing the QMS and critical supply-chain controls/i)).toBeInTheDocument();
    expect(screen.getByText("Qualify the job")).toBeInTheDocument();
    expect(screen.getByText("Control production")).toBeInTheDocument();
    expect(screen.getByText("Verify before shipment")).toBeInTheDocument();
    expect(screen.getByText("Supplier qualification records")).toBeInTheDocument();
    expect(screen.getByText(/We work with suppliers holding ISO 9001, ISO 13485, IATF 16949, EN 9100/i)).toBeInTheDocument();
    expect(screen.getByText(/we use it to shortlist an eligible supplier/i)).toBeInTheDocument();
    expect(screen.getByText("Inspection capability matched to the job")).toBeInTheDocument();
    expect(screen.getByText(/Before award, we match the drawing and customer requirements to a supplier with the right inspection resources/i)).toBeInTheDocument();
    expect(screen.getByText(/documented capability includes 12 CMMs plus vision measurement, X-ray fluorescence \(XRF\)/i)).toBeInTheDocument();
    expect(screen.getByText(/provide the requested reports and maintain required traceability through shipment/i)).toBeInTheDocument();
    expect(screen.getByText(/parts produced to the approved requirements, with the inspection evidence and documentation your customer expects/i)).toBeInTheDocument();
    expect(screen.queryByText(/inspection-equipment records/i)).not.toBeInTheDocument();
  });
});
