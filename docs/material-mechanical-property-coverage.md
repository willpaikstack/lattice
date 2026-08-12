# Reference mechanical-property coverage

Last updated: 2026-08-10

This is the live directory backlog: labels without a condition-specific, source-backed reference row. These are intentionally blank in the customer UI. A generic material name or an unstated temper is not enough to publish a responsible reference row. When a source publishes only part of the five-field set, the mapped row explicitly says `Not published` for the omitted field rather than borrowing it from another condition.

## Summary

**90 customer-facing catalog records are currently unresolved.** The count is offering-level for Aluminum: a single alloy offering can expose multiple supported conditions, and its property table follows the condition the buyer is viewing. A bare Aluminum offering is not counted as unresolved when it has a cited reference condition, or when one of its displayed conditions has a source-backed row.

| Family | Missing labels |
| --- | ---: |
| Aluminum | 0 |
| Stainless steel | 10 |
| Mild steel | 6 |
| Brass | 3 |
| Copper | 4 |
| Alloy steel | 1 |
| Tool steel | 0 |
| Titanium | 1 |
| Inconel / Incoloy | 21 |
| Precision alloys | 2 |
| Magnesium / zinc | 3 |
| Plastics / polymers | 39 |

## Missing labels by family

- **Aluminum (0 offerings):** All 21 Aluminum offerings have a source-backed reference row. For `1070` and `2007`, the selected source does not publish hardness; the UI explicitly says `Not published` rather than fabricating a value. See [the source log](./material-mechanical-property-sources.md) for the reference conditions and caveat.

- **Stainless steel (10):** `302`, `SS 304H`, `SS 316H`, `Nitronic 40`, `Custom 455`, `253MA`, `254SMO`, `817M40T`, `Nitronic 50`, `Nitronic 60`. These are distinct stainless specifications or heat-resisting variants. A 304/316 room-temperature row would be a misleading substitute for most of them.

- **Mild steel (6):** `1.033`, `SECC`, `SGCC`, `SPCC`, `SPHC`, `SPTE`. `44W Steel` now uses the published SSAB CSA 44WT plate condition; the source does not publish hardness or density, so those two cells state `Not published`.

- **Brass (3):** `Brass`, `Brass H59`, `Brass H62`. These labels do not state a standard alloy/UNS number or temper, so the mechanical response cannot be selected responsibly.

- **Copper (4):** `Beryllium Copper`, `Bronze`, `QSN6-6-3 / CuSn6Zn6`, `QSN6.5-0.1 / CuSn6`. “Beryllium copper” and “bronze” are families, not a unique alloy/temper; the two QSN designations also need an exact product condition.

- **Alloy steel (1):** `18CrNiMo7-6 / 1.6587`. The manufacturer sheet has a set of size- and condition-specific ranges that does not support one unambiguous five-field reference row for the catalog label. It remains blank pending an exact delivered condition.

- **Tool steel (0):** All current Tool-steel labels resolve to a cited reference condition. `1.2085` uses a prehardened product condition rather than an unstated generic grade.

- **Titanium (1):** `Titanium`. It is a family label with no grade, oxygen content, or anneal condition.

- **Inconel / Incoloy (21):** `Alloy X`, `Inconel 690`, `Alloy 28`, `Alloy B-3`, `Alloy C-4`, `Alloy G-30`, `Alloy G-35`, `Alloy N`, `Hastelloy B-2`, `AerMet 100`, `Alloy 188`, `Alloy 242`, `Alloy 263`, `Alloy 556`, `MP35N`, `MP159`, `Multimet N155`, `Nimonic 300`, `R31537`, `Alloy R41`, `Alloy S`. Most require a named producer data sheet with a stated solution/age/anneal treatment; `Alloy X` is ambiguous and `AerMet 100` is a steel incorrectly carried in the nickel grouping.

- **Precision alloys (2):** `4J32`, `1J85`. These magnetic/controlled-expansion grades require the final anneal and strip/wire/bar form before a comparison table is meaningful.

- **Magnesium / zinc (3):** `Magnesium`, `ZN`, `Zinc`. The labels do not state a recognized alloy or condition; pure zinc and generic magnesium are not sound proxies for network stock.

- **Plastics / polymers (39):** `ABS+30% GF`, `ABS+30% PC`, `Fire-Resistant PC`, `Flame Retardant ABS`, `PC+ABS/T85`, `Acetal Copolymer (POM-C) ESD`, `Delrin 30% Glass Filled`, `Delrin 100 AF`, `POM+30%GF`, `PA+13%GF`, `PA+15%GF`, `PA+20%GF`, `PA+30%GF`, `PA12+30%GF`, `PA66+20%GF`, `PA66+30%GF`, `PEEK 30% Glass Filled`, `PPS+30%GF`, `PPS+40%GF`, `ULTEM 2300`, `PP+20%GF`, `PP+30%GF`, `ASTM D6100`, `Bakelite Resin`, `Carbon Fibre`, `EPDM`, `Fibre glass`, `PC + PU8400 Overmolded`, `Photopolymer Resin`, `PU8150`, `PU8400`, `PX233 HT`, `PX521`, `PX527`, `FR4`, `Garolite G-10`, `Garolite G-10 / FR4`, `Garolite G-11 / FR5`, `PC+30%GF`. These are filled, flame-retarded, ESD, multi-material, fiber/composite, elastomeric, or proprietary grades. Their properties cannot be represented by the corresponding unfilled commodity polymer.

## Next work

Prioritize condition/form records for the remaining distinct steel labels, beginning with `18CrNiMo7-6 / 1.6587` once its actual delivery condition is known. Then collect producer data sheets for the nickel superalloys and the modified/composite polymer grades. Do not publish generic material-name values or blend filled and unfilled polymer data.

## Partial reference rows

These labels have a visible, source-linked row but one or more selected-source fields are unavailable. They are not counted in the 91 fully unresolved labels above, and the UI calls out the omission instead of filling it from a different condition.

| Family | Labels | Unpublished fields | Why |
| --- | --- | --- | --- |
| Aluminum | `1070`, `2007` | Hardness | The selected H14/T4 references publish the tensile data and density but not hardness. |
| Mild steel | `44W Steel` | Hardness, density | The SSAB CSA 44WT plate data publishes tensile requirements, not those reference values. |
| Alloy / Tool steel | `1.0737`, `1.6580 / 30CrNiMo8 Alloy Steel`, `1.6582 / 34CrNiMo6 Alloy Steel`, `Toolox 33` | `1.0737` / 1.6580 / 1.6582: hardness and density; Toolox 33: density | The selected producer sheets provide the stated-condition tensile data but do not publish every field in the shared customer table. |
| Tool steel | `A2 Steel`, `SKD11`, `O1 Tool Steel`, `ST TOOL M2` | Yield, tensile, elongation | The selected annealed tool-steel references provide hardness and density but no compatible tensile-test set. |
| Precision alloys | `1J50`, `1J79` | Yield, tensile, elongation, hardness | Magnetic-alloy properties depend on final anneal and form; the current reference set publishes density only. |
