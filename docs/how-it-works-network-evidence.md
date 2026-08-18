# How-it-works network evidence

Last reviewed: 2026-08-18

This note records the source basis and caveats for the public evidence shown inside the expandable `More capacity` and `Managed quality` sections on `/how-it-works`.

## Public industry coverage

The home-page `Partner-network experience` section identifies industries represented by documented supplier capabilities, rather than naming supplier customers or displaying their trademarks.

- Zintilon publicly describes manufacturing support across industries and presents customer-brand imagery, but that imagery is not used by Lattice and is not evidence of a direct Lattice customer relationship.
- Best Prototypes lists automotive, aerospace, automation, medical, energy, semiconductor, office-equipment, and electronic-appliance coverage on its [official site](https://www.best-prototype.com/).
- Shenzhen Jucheng Precision Model lists automotive, medical devices, consumer products, aviation/aerospace, and robotics/automation on its [official site](https://www.jcproto.com/).
- Industry coverage represents self-reported supplier capability only. It does not imply a relationship, endorsement, approval, or current production engagement with any downstream brand. Production fit and availability are confirmed for each job.

## Network geography

- The public network map marks the five operator-confirmed network cities: Shenzhen, Dongguan, Beijing, Shanghai, and Tianjin.
- Markers are positioned in page code over a pin-free map asset so the public geography remains reviewable and does not depend on decorative points baked into the illustration.
- City-level geography may be shown publicly; supplier identities and exact facility addresses remain confidential.

## CNC capacity

The public CNC snapshot is calculated at render time from `src/lib/vendor-equipment.ts`:

- CNC machine total: sum of the numeric quantities on records classified as `CNC Milling` or `CNC Lathe`.
- Milling / turning split: the same quantity sum grouped by those two categories.
- Explicit 5-axis count: quantity sum for CNC records whose normalized equipment name contains `5-axis`.
- Current result on 2026-08-18: 335 machines, comprising 282 milling and 53 turning/turn-mill machines; 109 are explicitly listed as 5-axis.

The public high-level envelope examples are also present in the normalized catalog: the Gromax GRM-3022X lists a 3000 × 2200 × 1100 mm milling envelope, while the Puma 4005LM lists a Ø500 × 2000 mm turning envelope. These records describe documented capacity, not real-time availability; availability is confirmed during quoting.

## Manufacturing quality systems

- Zintilon: the archived supplier-provided certificate package at `docs/vendor-sources/zintilon/zintilon-certificates-20250108.rar` contains ISO 9001:2015, ISO 13485:2016, IATF 16949:2016, EN 9100:2018, ISO 14001:2015, ISO 45001:2018, and ISO 50001:2018 files. Its [official certification page](https://www.zintilon.com/certification/) lists the same systems. Certificate scope and current validity still require review before a customer-facing job claim.
- Best Prototypes: its [official quality page](https://www.best-prototype.com/quality-assurance.html) says its quality program is based on ISO 9001, finished assemblies are inspected, incoming material batches require material certificates, and material chemistry can be checked by spectrometer. This is recorded as an ISO 9001-based program, not as a verified ISO certificate.
- Shenzhen Jucheng Precision Model: its [official company page](https://www.jcproto.com/aboutus.html) states ISO 9001:2015, ISO 14001, ISO 13485, and IATF 16949 certification. Lattice also holds the supplier's traceability-control procedure at `docs/vendor-sources/jucheng-precision/jucheng-traceability-control-procedure.doc`; current certificates still need to be collected and validated.

## Inspection capability

- The public CMM total is calculated from the normalized `QC & Inspection` records in `src/lib/vendor-equipment.ts`. The current aggregate is 17 documented CMMs: eight machines in Zintilon's `Zintilon QC Equipment List & 2026 Calibration Plan`, four machines in Best Prototypes' equipment list, and five machines in the Jucheng equipment records.
- Zintilon's January 23, 2026 calibration plan also documents automatic image-measurement systems, an X-ray fluorescence (XRF) material analyzer, surface-roughness and film-thickness instruments, hardness testers, microscopes, force measurement, and ultrasonic flaw detection. Calibration currency remains an award-time verification item.
- Best Prototypes' inspection list documents 2D and 2.5D measuring machines, height and depth gauges, roughness and hardness testing, micrometers, more than 100 pin gauges, and more than 100 thread gauges in addition to its four CMMs.
- Jucheng's `Identification and Traceability Control Procedure` assigns incoming inspection, in-process inspection-status control, nonconforming-product segregation, finished-goods inspection records, and material-batch traceability across quality, warehouse, and production functions. It is process-control evidence rather than an equipment count.

## Raw-material quality and traceability

- Tianjin ZYTC Alloy Technology: its [official site](https://www.zytcalloy.com/) lists AS9120, ISO 9001, ISO 14001, and ISO 45001 and describes supply-chain coverage across melting, forging, rolling, heat treatment, machining, testing, and logistics. Lattice's archived ZYTC catalog covers nickel/cobalt alloys, stainless steel, titanium, and alloy steel with AMS, ASTM, BS, and UNS references. Catalog inclusion is not treated as a current stock commitment.
- Huaxiao Metal: its [Inconel page](https://www.huaxiaometal.com/steel-products/special-alloy-steel/inconel-alloy.html) lists Inconel 600, 601, 617, 625, 718, and X-750 across sheet, plate, bar, tube, strip, coil, and wire forms. It states that standard MTCs are included and that ASTM/AMS traceability, EN 10204 3.1/3.2 documentation, and third-party inspection can be requested. These are public supplier claims and must be verified against the actual quote, heat/lot documentation, and purchase requirements.

## Public-copy policy

- Keep supplier identities confidential on the public page; present evidence in aggregate.
- Do not translate website logos or quality-program language into a verified certification claim.
- Confirm certificate holder, standard, scope, issuing body, expiration/current validity, and applicability before award.
- Confirm raw-material grade, form, condition, heat/lot traceability, required MTC level, and any third-party inspection on the RFQ and purchase order.
