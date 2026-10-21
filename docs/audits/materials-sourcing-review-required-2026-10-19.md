# Materials currently marked Sourcing review required

Snapshot: October 19, 2026, current local comparison picker.

The flag is computed from absence of a matching legacy selectable RFQ variant, or a listed condition without an exact legacy variant. It is not a supplier availability assessment and is independent of whether UNS/composition metadata exists.

197 flagged search choices: 189 catalog grade choices plus 8 explicit condition choices. Seven condition choices belong to grades with another legacy requestable variant; 2017 T4 belongs to a catalog-only grade. Counts include both the 2017 parent and its T4 condition.

| Family | Count | Flagged choices |
|---|---:|---|
| Aluminum | 13 | 1070; 2A12; 2A14; 2017; A413; 2014 · T6; 2014 · T651; 2017 · T4; 2024 · T3; 5052 · H32; 6060 · T6; 6063 · T6; 6082 · T6 |
| Stainless steel | 33 | 302; 303Se; 303Sulf; 304H; 304LVM; 309; 310; 310S; 316H; 316LVM; 321; 347; 347H; 20Cr13; 40Cr13; 410Mod; 430F; 430FR; 431; EN 1.4005; Nitronic 40; 13-8PH; Custom 455; Duplex 2205 / S31803; Duplex 2205 / S32205; Duplex F51; Duplex F55; Super Duplex 2507; Z100 / S32760; 253MA; 254SMO; 904L; Nitronic 50 |
| Mild steel | 20 | 1018S; AISI 1010; C22; S15C; Steel 20#; Steel 1010; Steel 1020; Steel 1045 / 45#; 44W Steel; FE510 Steel; Q235; S355; S355J2; SS400; Steel S355JR; SECC; SGCC; SPCC; SPHC; SPTE |
| Brass | 2 | Brass H59; Brass H62 |
| Copper | 3 | Beryllium Copper; QSN6-6-3 / CuSn6Zn6; QSN6.5-0.1 / CuSn6 |
| Alloy steel | 14 | 40CrMnMoS8-6 / 1.2312; 40CrNiMo; 4140 Annealed; 4140 Normalized; 18CrNiMo7-6 / 1.6587; 300M VAR / E4340 Mod; 4330 Mod VM N&T; AerMet 100; EN19; 16MnCrS5; 6150 Vac Melt Annealed; 9310 / E9310; 52100; Toolox 33 |
| Tool steel | 2 | 1.2085; ST TOOL M2 |
| Titanium | 11 | Grade 1; Grade 3; Grade 4; 6Al-2Sn-4Zr-2Mo; 6Al-6V-2Sn; 6Al-7Nb; 8Al-1Mo-1V; Grade 6 / 5Al-2.5Sn; Grade 7; Grade 9 / 3Al-2.5V; Grade 12 |
| Nickel & specialty alloys | 49 | Alloy 80A; Alloy 686; Alloy 725; Alloy X; Incoloy 800; Incoloy 800H; Incoloy 800HT; Incoloy 825; Incoloy 925; Incoloy A-286; Inconel 600; Inconel 601; Inconel 617; Inconel 690; Inconel 718; Inconel X-750; Alloy 20; Alloy 28; Alloy 282; Alloy B-3; Alloy C-4; Alloy C-22; Alloy C-276; Alloy G-30; Alloy G-35; Alloy N; Hastelloy B-2; Hastelloy C-22; Hastelloy C-276; Hastelloy X; Monel 400; Monel K-500; Nickel 200; Nickel 201; Alloy 25 / L605; MP35N; MP159; Multimet N155; Alloy 188; Alloy 230; Alloy 242; Alloy 263; Alloy 556; Nimonic 300; R31537; Waspaloy; 330 / RA330; Alloy R41; Alloy S |
| Precision alloys | 5 | 4J32; Invar; 1J50; 1J79; 1J85 |
| Magnesium / zinc alloys | 6 | AM60B; AZ31B; AZ91D; Zamak 3; Zamak 5 / ASTM AC41A; ZN |
| Plastics / polymers | 39 | ABS Black / White; ABS+30% GF; ABS+30% PC; Fire-Resistant PC; Flame Retardant ABS; PC+ABS/T85; POM / Delrin; POM-C; POM-H; POM+30%GF; Nylon 6; Nylon 66; PA / Nylon; PA+13%GF; PA+15%GF; PA+20%GF; PA+30%GF; PA12; PA12+30%GF; PA66+20%GF; PA66+30%GF; PPS+30%GF; PPS+40%GF; PVDF; TEFLON; HDPE 1000; PE; PP; PP+20%GF; PP+30%GF; Bakelite Resin; EPDM; Fibre glass; PBT; PETP; Photopolymer Resin; PMMA; PC; PC+30%GF |

## Conditions on otherwise legacy-requestable grades

2014 T6; 2014 T651; 2024 T3; 5052 H32; 6060 T6; 6063 T6; 6082 T6.

Source: evaluated current exports in `src/lib/material-quote-offerings.ts` (`materialSearchChoices`, `materialOfferings`). No application changes, tests or deployment.
