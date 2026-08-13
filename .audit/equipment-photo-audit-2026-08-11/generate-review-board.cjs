/* eslint-disable @typescript-eslint/no-require-imports */
const sharp = require("sharp");
const path = require("path");

const root = __dirname;
const board = path.join(root, "equipment-photo-audit-review-board.png");
const W = 2800;
const H = 2600;

const escape = (value) => value.replace(/[&<>]/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
}[character]));

function svg(width, height, body) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <style>
      .eyebrow { font: 700 22px Arial, sans-serif; letter-spacing: 3px; fill: #6b7280; }
      .title { font: 700 58px Arial, sans-serif; fill: #111827; }
      .subtitle { font: 400 28px Arial, sans-serif; fill: #4b5563; }
      .cardTitle { font: 700 26px Arial, sans-serif; fill: #111827; }
      .body { font: 400 22px Arial, sans-serif; fill: #374151; }
      .small { font: 400 19px Arial, sans-serif; fill: #6b7280; }
      .badge { font: 700 18px Arial, sans-serif; fill: #991b1b; letter-spacing: 1px; }
    </style>${body}</svg>`);
}

function textLines(lines, x, y, className, lineHeight) {
  return lines.map((line, index) => `<text x="${x}" y="${y + index * lineHeight}" class="${className}">${escape(line)}</text>`).join("");
}

async function addScreen(composites, file, x, y, width, height, title, notes, severity) {
  composites.push({
    input: svg(width, height, `<rect width="${width}" height="${height}" rx="22" fill="#ffffff" stroke="#d1d5db" stroke-width="2"/>`),
    left: x,
    top: y,
  });
  const image = await sharp(path.join(root, file)).resize({ width: width - 48, height: height - 178, fit: "contain", background: "#f9fafb" }).png().toBuffer();
  composites.push({ input: image, left: x + 24, top: y + 24 });
  composites.push({
    input: svg(width - 48, 130, `<rect width="140" height="32" rx="16" fill="#fee2e2"/>${textLines([severity], 13, 23, "badge", 20)}${textLines([title], 0, 72, "cardTitle", 28)}${textLines(notes, 0, 106, "small", 24)}`),
    left: x + 24,
    top: y + height - 154,
  });
}

(async () => {
  const composites = [];
  composites.push({
    input: svg(W, 270, `
      <rect width="${W}" height="270" fill="#f8fafc"/>
      ${textLines(["EQUIPMENT PAGE · PHOTO TRUST AUDIT"], 100, 72, "eyebrow", 28)}
      ${textLines(["The cards are clean; the imagery is not yet proof."], 100, 148, "title", 64)}
      ${textLines(["83 advertised equipment records · 55 image paths · 37 records use a shared image asset"], 100, 213, "subtitle", 32)}
    `), left: 0, top: 0,
  });
  await addScreen(composites, "01-milling-current.png", 100, 340, 1260, 760, "1. Specific inventory, generic proof", ["Every visible model is labeled Representative image.", "That avoids overclaiming—but cannot establish ownership."], "HIGH");
  await addScreen(composites, "06-vmc850-logo-mismatch.png", 1440, 340, 1260, 760, "2. Incorrect image: logo instead of machine", ["Shandong Shengyu 850 is represented by a badge/logo.", "Remove or replace immediately."], "CRITICAL");
  await addScreen(composites, "04-sheet-metal.png", 100, 1180, 1260, 760, "3. Reused model imagery", ["Different laser and press-brake records visually repeat.", "A category image should not stand in for a named model."], "HIGH");
  await addScreen(composites, "05-additive.png", 1440, 1180, 1260, 760, "4. Cross-category photo mismatch", ["The printer fleets use a photo of a manufactured bracket.", "This is actively misleading for capability evaluation."], "CRITICAL");
  const contact = await sharp(path.join(root, "reused-photo-assets.png")).resize({ width: 1160, height: 560, fit: "contain", background: "#ffffff" }).png().toBuffer();
  composites.push({ input: svg(1160, 600, `<rect width="1160" height="600" rx="22" fill="#ffffff" stroke="#d1d5db" stroke-width="2"/>`), left: 100, top: 2020 });
  composites.push({ input: contact, left: 100, top: 2040 });
  composites.push({
    input: svg(1310, 600, `
      <rect width="1310" height="600" rx="22" fill="#111827"/>
      ${textLines(["Recommended customer-safe photo policy"], 56, 80, "cardTitle", 30).replace("#111827", "#ffffff")}
      <text x="56" y="80" style="font:700 30px Arial,sans-serif;fill:#ffffff">Recommended customer-safe photo policy</text>
      <text x="56" y="142" style="font:400 24px Arial,sans-serif;fill:#d1d5db">1. Actual supplier machine — facility photo tied to this record.</text>
      <text x="56" y="196" style="font:400 24px Arial,sans-serif;fill:#d1d5db">2. Verified same model — exact make/model, but not supplier-owned.</text>
      <text x="56" y="250" style="font:400 24px Arial,sans-serif;fill:#d1d5db">3. Representative — category-level only; never on a named model card.</text>
      <text x="56" y="342" style="font:700 24px Arial,sans-serif;fill:#ffffff">Immediate cleanup</text>
      <text x="56" y="388" style="font:400 24px Arial,sans-serif;fill:#d1d5db">• Remove logo and bracket images from equipment cards.</text>
      <text x="56" y="432" style="font:400 24px Arial,sans-serif;fill:#d1d5db">• Explicitly classify all 83 images before customer display.</text>
      <text x="56" y="476" style="font:400 24px Arial,sans-serif;fill:#d1d5db">• Replace high-priority CNC, QC, and additive imagery first.</text>
    `), left: 1390, top: 2020,
  });
  await sharp({ create: { width: W, height: H, channels: 4, background: "#f3f4f6" } }).composite(composites).png().toFile(board);
  console.log(board);
})().catch((error) => { console.error(error); process.exit(1); });
