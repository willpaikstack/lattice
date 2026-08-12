# Customer material mechanical-property references

Last updated: 2026-08-10

## Purpose and display rule

The customer materials directory presents **typical room-temperature reference values** for a stated condition and product form. They are comparison aids only—not design allowables, purchase specifications, or mill certifications. The source link is displayed with every populated row.

Each displayed supplier label is resolved to a canonical grade/condition record where a defensible equivalence exists. This prevents aliases such as `304 Stainless Steel`, `SS 304`, and `SS 304 / 1.4301` from carrying separately copied values. For a bare Aluminum offering with no supplier-listed temper, the UI may display a clearly labelled **reference condition** from the cited source. This is a comparison aid, not a claim about delivered stock; the RFQ still confirms the supplied temper, form, and certification.

## Source hierarchy

1. Producer or standards-aligned material data sheets where they state the relevant grade and condition.
2. NIST / Aluminum Association reference data for wrought aluminum.
3. ASM / MatWeb reference records for condition-specific grades without a producer sheet in the current source set.

Primary reference collections used in this pass:

- [Outokumpu Core stainless range data sheet](https://www.outokumpu.com/-/media/files/products/core/outokumpu-core-range-datasheet.pdf)
- [Carpenter Alloy 416 data](https://www.carpentertechnology.com/alloy-finder/416)
- [TIMET commercial-pure titanium data](https://www.timet.com/assets/local/documents/datasheets/cpgrades/50a.pdf)
- [Special Metals technical bulletins](https://www.specialmetals.com/documents/guides-and-handbooks/)
- [Special Metals Nickel 200 / 201 bulletin](https://www.specialmetals.com/documents/technical-bulletins/nickel-200.pdf)
- [NIST / Aluminum Association wrought-aluminum reference](https://materialsdata.nist.gov/bitstream/handle/11115/179/Properties%20of%20Wrought%20Aluminum.pdf)
- [Hydro EN AW-6060 extruded-products data sheet](https://www.hydro.com/globalassets/08-about-hydro/hydro-worldwide/germany/extrusion-germany/alloy-data-sheets/hydro-en-aw-6060.pdf)
- [Alliance 6063-T6 data sheet](https://allianceorg.com/pdfs/alumext/6063t6.pdf)
- [Batz + Bürgel EN AW-6082 data sheet](https://batz-burgel.com/wp-content/uploads/data-en/BB_6082.pdf)
- [Klöckner EN AW-5083 data sheet](https://facts.kloeckner.de/werkstoffe/aluminium/3-3547/)
- [ASM / MatWeb material search](https://www.matweb.com/search/QuickText.aspx?SearchText=material%20properties)
- [Kaiser 7050 sheet, coil, and plate data](https://online.kaiseraluminum.com/depot/PublicProductInformation/Document/1016/Kaiser_Aluminum_7050_Sheet_Coil_and_Plate.pdf)
- [thyssenkrupp 5251-H22 data sheet](https://ucpcdn.thyssenkrupp.com/_legacy/UCPthyssenkruppBAMXUK/assets.files/material-data-sheets/aluminium/5251-h22.pdf)
- [NADCA aluminum die-casting alloy data](https://tcdcinc.com/assets/NADCA_Alloy_Data_2009.pdf)
- [Mingtai 2A14 round-bar data](https://m.mingtai-al.com/2A14-Aluminum-Round-Bar.html)
- [SSAB CSA 44WT plate data](https://www.ssab.com/en-us/brands-and-products/commercial-steel/structural-steel/csa-g40-21-13/44wt)
- [Kanat 11SMnPb37 / 1.0737 data sheet](https://www.kanatcelik.com/_files/ugd/f21b16_622ee01f358d442a9fab068415ae326b.pdf?index=true)
- [Hillfoot 30CrNiMo8 / 1.6580 data sheet](https://www.hillfoot.com/files/30crnimo8-1.6580.pdf)
- [Hillfoot 34CrNiMo6 / 1.6582 data sheet](https://www.hillfoot.com/files/34crnimo6-1.6582.pdf)
- [SSAB Toolox 33 product data](https://www.ssab.com/en/brands-and-products/toolox/product-offer/toolox-33)
- [HABA 1.2085 prehardened mould-steel data](https://www.haba-gmbh.at/en/cuts/steel/haba-2316-s)
- [Copper Development Association alloy database](https://alloys.copper.org/)
- [Ensinger thermoplastic materials overview](https://www.ensingerplastics.com/en-gb/thermoplastic-materials)

Machinability ratings use the directory’s three-level qualitative scale. For mild steel, the mapping is condition-aware: cold-drawn 1018 is sourced at 70% and cold-rolled 1020 at 65%, both relative to AISI 1212; cold-drawn 1045 is sourced at 55%. A36 / Q235 and S355 structural entries are marked `Fair`, reflecting the cited A36 estimate and EN 10025 chip-formation caveat rather than implying a universal percentage. Sources: [1018](https://www.matweb.com/search/datasheet_print.aspx?matguid=3a9cc570fbb24d119f08db22a53e2421), [1020](https://www.matweb.com/search/datasheet.aspx?matguid=10b74ebc27344380ab16b1b69f1cffbb&n=1), [1045](https://asia.matweb.com/search/SpecificMaterialPrint.asp?bassnum=m1045a), [A36 estimate](https://www.beams-steel.com/info/what-is-the-machinability-rating-of-astm-a36i-103239907.html), and [EN 10025-2](https://gangsteel.net/uploads/soft/150729/EN10025-2.pdf).

## Coverage at this revision

Counts are unique labels in the customer directory after aliases are resolved. Duplicated upstream offerings are not counted twice.

All 21 currently surfaced Aluminum offerings now have a reference row. Existing supplier-listed tempers remain condition-backed. The eleven formerly blank bare offerings use a stated, sourced reference condition; the catalog does not represent that condition as guaranteed availability.

| Family | Sourced labels | Labels held blank | Notes |
| --- | ---: | ---: | --- |
| Stainless steel | 74 / 86 | 12 | Covers common austenitic, martensitic/ferritic, PH, duplex, and 904L / Alloy 20 records. |
| Mild steel | 18 / 24 | 6 | Coated/sheet trade labels remain blank because grade and coating condition are not specific enough. |
| Alloy steel | 28 / 29 | 1 | Common Cr-Mo, high-strength, bearing, and carburizing records are condition-specific. |
| Tool steel | 12 / 12 | 0 | Annealed or prehardened condition is shown where it is the cited source condition. |
| Titanium | 17 / 19 | 2 | CP Grades 1–4 and common alpha-beta grades are covered. Generic `Titanium` remains blank. |
| Inconel / Incoloy | 44 / 70 | 26 | Producer-bulletin coverage prioritizes Inconel, Incoloy, Monel, Nickel 200/201, and common superalloys. |

### Aluminum reference-condition additions — 2026-08-10

`1070` (H14), `2A12` (T4), `2A14` (T6), `3003` (H14), `A413` (die cast), `MIC-6` (cast tooling plate), `2007` (T4), `2017A` (T451), `5251` (H22), `5754` (H22), and `7050` (T7451) were researched and added. `1070-H14` and `2007-T4` do not publish a hardness value in the selected reference; the UI says `Not published` rather than inferring one. All other values are recorded with their stated source condition.

## Held-blank labels in this pass

- Stainless: `302`, `SS 304H`, `SS 316H`, `Nitronic 40`, `Custom 455`, `1.2085`, `253MA`, `254SMO`, `817M40T`, `Nitronic 50`, `Nitronic 60`.
- Stainless: `302`, `SS 304H`, `SS 316H`, `Nitronic 40`, `Custom 455`, `253MA`, `254SMO`, `817M40T`, `Nitronic 50`, `Nitronic 60`.
- Mild: `1.033`, `SECC`, `SGCC`, `SPCC`, `SPHC`, `SPTE`.
- Brass: `Brass`, `Brass H59`, `Brass H62`.
- Copper: `Beryllium Copper`, `Bronze`, `QSN6-6-3 / CuSn6Zn6`, `QSN6.5-0.1 / CuSn6`.
- Alloy: `18CrNiMo7-6 / 1.6587`.
- Tool: none.
- Titanium: `Titanium`.
- Nickel: `Alloy X`, `Inconel 690`, `Alloy 28`, `Alloy B-3`, `Alloy C-4`, `Alloy G-30`, `Alloy G-35`, `Alloy N`, `Hastelloy B-2`, `AerMet 100`, `Alloy 188`, `Alloy 242`, `Alloy 263`, `Alloy 556`, `MP35N`, `MP159`, `Multimet N155`, `Nimonic 300`, `R31537`, `Alloy R41`, `Alloy S`.
- Precision: `4J32`, `1J85`.
- Magnesium / zinc: `Magnesium`, `ZN`, `Zinc`.
- Plastics: 39 modified, filled, composite, elastomeric, or proprietary labels listed in [the coverage report](./material-mechanical-property-coverage.md).
- Titanium: `Titanium`, `8Al-1Mo-1V`.
- Inconel / Incoloy: `Alloy 80A`, `Alloy X`, `Inconel 690`, `Alloy 20`, `Alloy 28`, `Alloy B-3`, `Alloy C-4`, `Alloy G-30`, `Alloy G-35`, `Alloy N`, `Hastelloy B-2`, `AerMet 100`, `Alloy 188`, `Alloy 242`, `Alloy 263`, `Alloy 556`, `MP35N`, `MP159`, `Multimet N155`, `Nimonic 300`, `R31537`, `Alloy R41`, `Alloy S`, `Invar`, `Invar 36`, `Kovar`.

The held-blank list is intentional. It is the backlog for acquiring an exact producer or standards source and mapping its stated condition before adding a customer-facing value.
