# Customer material machinability coverage

Last updated: 2026-08-09

## Policy

The catalog uses a deliberately simple three-level signal:

- **Good** — documented good/excellent machinability or a commonly cited relative rating of roughly 60% or higher in the stated condition.
- **Fair** — workable with normal production controls, but materially dependent on stock condition, chip control, or workholding.
- **Difficult** — work-hardening, high-carbide, fiber-filled, high-purity/ductile, or high-strength material that needs a more specialized machining plan.

The rating is not cutting data. Every populated directory detail includes a source link and condition-aware guidance. Labels without a defensible exact source are blank, not estimated.

## Coverage

The catalog currently has 312 canonical customer-facing records across material families. **273 are mapped; 39 remain blank.** Aluminum availability is grouped by alloy offering, with condition-specific variants exposed inside the offering.

| Family | Mapped | Unresolved |
| --- | ---: | ---: |
| Aluminum | 21 / 21 | 0 |
| Stainless steel | 58 / 58 | 0 |
| Mild steel | 17 / 24 | 7 |
| Brass | 2 / 5 | 3 |
| Copper | 3 / 7 | 4 |
| Alloy steel | 19 / 22 | 3 |
| Tool steel | 7 / 7 | 0 |
| Titanium | 13 / 14 | 1 |
| Inconel / Incoloy | 51 / 53 | 2 |
| Precision alloys | 3 / 7 | 4 |
| Magnesium / zinc alloys | 3 / 8 | 5 |
| Plastics / polymers | 76 / 86 | 10 |

## Unresolved labels

| Family | Labels intentionally left blank | Why |
| --- | --- | --- |
| Mild steel | `1.033`, `SECC`, `SGCC`, `SPCC`, `SPHC`, `SPTE`, `A514 Steel` | Incomplete W.Nr., coating/form standards, or no condition-specific machining reference. |
| Brass | `Brass`, `Brass H59`, `Brass H62` | Generic or regional brass designation without composition/temper. |
| Copper | `Beryllium Copper`, `Bronze`, `QSN6-6-3 / CuSn6Zn6`, `QSN6.5-0.1 / CuSn6` | Alloy family/Chinese designation lacks a traceable exact temper or UNS mapping. |
| Alloy steel | `40CrNiMo`, `4140`, `18CrNiMo7-6 / 1.6587` | Grade alone does not establish heat-treatment condition; no condition-specific source mapped. |
| Titanium | `Titanium` | Generic family label, not a grade. |
| Inconel / Incoloy | `Alloy X`, `Nimonic 300` | Ambiguous/nonstandard listing or no reliable named-grade machining reference found. |
| Precision alloys | `4J32`, `1J50`, `1J79`, `1J85` | Final anneal/composition condition is essential and no direct machining source is mapped. |
| Magnesium / zinc | `Magnesium`, `Zamak 3`, `Zamak 5 / ASTM AC41A`, `ZN`, `Zinc` | Generic label or casting alloy without an exact machining source. |
| Plastics / polymers | `ASTM D6100`, `Bakelite Resin`, `EPDM`, `PC + PU8400 Overmolded`, `Photopolymer Resin`, `PU8150`, `PU8400`, `PX233 HT`, `PX521`, `PX527` | Standard, elastomer, proprietary resin, or multi-material construction without one traceable machining condition. |

## Evidence set

- [NIST / Aluminum Association reference data](https://materialsdata.nist.gov/bitstream/handle/11115/179/Properties%20of%20Wrought%20Aluminum.pdf)
- [Outokumpu machining guidance](https://www.outokumpu.com/en/expertise/2021/machining-guide)
- [MatWeb 1018 cold-drawn data](https://www.matweb.com/search/datasheet_print.aspx?matguid=3a9cc570fbb24d119f08db22a53e2421)
- [TIMET Design and Fabrication Guide](https://www.timet.com/assets/local/documents/technicalmanuals/DesignandFabrication.pdf)
- [Special Metals technical bulletins](https://www.specialmetals.com/documents/technical-bulletins/)
- [Copper Development Association](https://copper.org/publications/newsletters/innovations/2001/08/intro_toc.php)
- [Ensinger machining-material guidance](https://www.ensingerplastics.com/en-us/machining/machining-materials)

Detailed per-grade source links live in the directory mapping in `src/components/material-grade-directory.tsx`. This report is the operational backlog for future exact-grade research.
