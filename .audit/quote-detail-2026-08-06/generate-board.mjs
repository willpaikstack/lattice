import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const root = "/Users/willsclaw/lattice/.audit/quote-detail-2026-08-06";

const images = [
  {
    file: "01-quote-detail-desktop.png",
    x: 80,
    width: 1100,
    height: 980,
    title: "1. Desktop quote overview",
    health: "Needs restructuring",
    notes: [
      "Strong two-column shell and clear primary action.",
      "Parts and pricing reads as disconnected fragments.",
      "Large empty area makes the quote feel unfinished.",
      "Move activity below the main quote or use the space for terms.",
    ],
  },
  {
    file: "02-quote-detail-narrow.png",
    x: 1380,
    width: 900,
    height: 1000,
    title: "2. Narrow responsive layout",
    health: "Structurally sound",
    notes: [
      "Cards stack cleanly and retain readable spacing.",
      "Part identity, specification, quantity, and price still lack a shared row.",
      "Use a responsive line-item pattern rather than floating blocks.",
    ],
  },
  {
    file: "03-quote-detail-mobile.png",
    x: 2480,
    width: 478,
    height: 1000,
    title: "3. Mobile header and part",
    health: "Needs attention",
    notes: [
      "Quote metadata reflows without overlap.",
      "Top navigation clips horizontally.",
      "The primary decision and total are pushed far below the quote header.",
    ],
  },
  {
    file: "04-quote-detail-mobile-summary.png",
    x: 3158,
    width: 478,
    height: 1000,
    title: "4. Mobile pricing and acceptance",
    health: "Needs attention",
    notes: [
      "Total and acceptance action are clear once reached.",
      "Shipping dash is ambiguous and weakens confidence.",
      "Use a sticky total and Accept quote bar on mobile.",
    ],
  },
];

const escapeXml = (value) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

const text = (x, y, value, size, weight = 400, fill = "#27272a") =>
  `<text x="${x}" y="${y}" font-family="Inter, Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${escapeXml(value)}</text>`;

const imageMarkup = [];

for (const item of images) {
  const data = await readFile(`${root}/${item.file}`, "base64");
  imageMarkup.push(
    `<rect x="${item.x - 1}" y="179" width="${item.width + 2}" height="${item.height + 2}" rx="8" fill="#ffffff" stroke="#d4d4d8"/>`,
    `<image x="${item.x}" y="180" width="${item.width}" height="${item.height}" preserveAspectRatio="xMidYMin meet" xlink:href="data:image/png;base64,${data}"/>`,
    `<rect x="${item.x}" y="1210" width="${item.width}" height="430" rx="8" fill="#ffffff" stroke="#d4d4d8"/>`,
    text(item.x + 28, 1260, item.title, 24, 650),
    text(item.x + 28, 1298, item.health, 17, 600, item.health === "Structurally sound" ? "#047857" : "#b45309"),
    ...item.notes.map((note, index) => text(item.x + 28, 1350 + index * 48, `- ${note}`, 16, 400, "#52525b")),
  );
}

const priorities = [
  ["01", "Rebuild Parts and pricing as a line item", "Part name and revision | Specification | Qty | Unit price | Total | Lead time"],
  ["02", "Add decision-critical commercial terms", "Lead time, validity, delivery estimate, payment terms, assumptions, and exclusions"],
  ["03", "Clarify the quote summary", "Replace ambiguous dashes and explain what accepting the quote will create"],
  ["04", "Improve mobile acceptance", "Use a sticky total and Accept quote action; remove clipped compact navigation"],
];

const priorityMarkup = priorities.flatMap(([number, title, detail], index) => {
  const y = 1830 + index * 122;
  return [
    `<circle cx="120" cy="${y - 8}" r="24" fill="#18181b"/>`,
    text(105, y - 1, number, 14, 700, "#ffffff"),
    text(165, y - 10, title, 22, 650),
    text(165, y + 26, detail, 16, 400, "#52525b"),
  ];
});

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="3716" height="2380" viewBox="0 0 3716 2380">
  <rect width="3716" height="2380" fill="#f4f4f5"/>
  ${text(80, 78, "Lattice OS - Quote detail audit", 38, 700)}
  ${text(80, 118, "LQ-4107 | Customer quote review | 06 Aug 2026", 18, 400, "#52525b")}
  ${imageMarkup.join("\n  ")}
  <rect x="80" y="1730" width="3556" height="560" rx="8" fill="#ffffff" stroke="#d4d4d8"/>
  ${text(112, 1784, "Recommended implementation order", 28, 700)}
  ${priorityMarkup.join("\n  ")}
</svg>`;

await writeFile(`${root}/quote-detail-audit-board.svg`, svg);

const baseBoard = await sharp(Buffer.from(svg)).png().toBuffer();
const screenshotLayers = await Promise.all(
  images.map(async (item) => ({
    input: await sharp(`${root}/${item.file}`)
      .resize({ width: item.width, height: item.height, fit: "fill" })
      .png()
      .toBuffer(),
    left: item.x,
    top: 180,
  })),
);

await sharp(baseBoard)
  .composite(screenshotLayers)
  .png()
  .toFile(`${root}/quote-detail-audit-board.png`);

console.log(`${root}/quote-detail-audit-board.png`);
