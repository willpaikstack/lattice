"""Build the invitation's one-page manufacturing overview draft."""
from pathlib import Path
import os

from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output/pdf/lattice-how-it-works-draft.pdf"
FONT_DIR = Path(os.environ.get("LATTICE_PDF_FONT_DIR", str(Path.home() / ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pdfjs-dist/standard_fonts")))
for name, filename in [("Lattice", "LiberationSans-Regular.ttf"), ("LatticeBold", "LiberationSans-Bold.ttf")]:
    pdfmetrics.registerFont(TTFont(name, str(FONT_DIR / filename)))

INK = HexColor("#232a30")
BODY = HexColor("#48515a")
MUTED = HexColor("#727a7f")
RULE = HexColor("#deddd7")
PAPER = HexColor("#f7f6f3")
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
c = canvas.Canvas(str(OUTPUT), pagesize=(612, 792))
c.setTitle("How Lattice works | Manufacturing overview")
c.setAuthor("Lattice")
c.setSubject("A one-page introduction to Lattice for invited customers")

def paragraph(text, x, top, width, size=11, leading=16, color=BODY, bold=False):
    style = ParagraphStyle("copy", fontName="LatticeBold" if bold else "Lattice", fontSize=size, leading=leading, textColor=color)
    p = Paragraph(text, style)
    _, height = p.wrap(width, 1000)
    p.drawOn(c, x, top-height)
    return top-height

def label(text, x, y):
    c.setFillColor(MUTED)
    t = c.beginText(x, y)
    t.setFont("LatticeBold", 8)
    t.setCharSpace(1.2)
    t.textOut(text)
    t.setCharSpace(0)
    c.drawText(t)

# Reproduce the platform's existing woven diamond mark as vector outlines.
c.setStrokeColor(INK)
c.setLineWidth(1.1)
for points in [ [(14,1.75),(26.25,14),(14,26.25),(1.75,14)], [(14,4.25),(19.5,9.75),(14,15.25),(8.5,9.75)], [(4.25,14),(9.75,8.5),(15.25,14),(9.75,19.5)], [(14,12.75),(19.5,18.25),(14,23.75),(8.5,18.25)], [(12.75,14),(18.25,8.5),(23.75,14),(18.25,19.5)] ]:
    path=c.beginPath()
    path.moveTo(44+points[0][0], 750-points[0][1])
    for x,y in points[1:]:
        path.lineTo(44+x,750-y)
    path.close()
    c.drawPath(path)
c.setFillColor(INK)
c.setFont("LatticeBold", 15)
c.drawString(81, 730, "LATTICE")
label("MANUFACTURING OVERVIEW", 378, 733)
c.setStrokeColor(RULE)
c.line(44, 711, 568, 711)

paragraph("How Lattice works",44,683,524,30,35,INK,True)
paragraph("More capacity. One accountable partner.",44,639,524,16,21,INK,True)
paragraph("Lattice helps domestic machine shops fulfill overflow and out-of-capability jobs through qualified manufacturing partners in China. We coordinate suppliers, production, quality documentation and delivery, so your team can focus on the work on your own floor.",44,602,524,11.5,17)

label("FROM RFQ TO DELIVERY",44,507)
steps = [
    ("Share your manufacturing requirements", "Submit a request for quote (RFQ) with drawings, CAD files, quantities, material and finish requirements, tolerances, required inspection documents and your target delivery date."),
    ("Review a supplier-backed quote", "We assess manufacturability, confirm requirements and validate a production path. Review pricing, expected lead time and quality documentation before committing."),
    ("Approve and launch production", "Once you approve the quote, Lattice coordinates the selected supplier and tracks production against the agreed plan. Your order record follows the job through delivery."),
    ("Review quality before shipment", "Review inspection reports, material certificates and other required documents on your order. When requested, shipment is held until you approve the documentation."),
]
top=479
for index,(title,copy) in enumerate(steps,1):
    c.setFillColor(PAPER)
    c.roundRect(44,top-27,28,28,7,fill=1,stroke=0)
    c.setFillColor(INK)
    c.setFont("LatticeBold",11)
    c.drawCentredString(58,top-18,str(index))
    paragraph(title,86,top,482,12,16,INK,True)
    paragraph(copy,86,top-24,482,10.5,15)
    top-=84

c.setFillColor(PAPER)
c.roundRect(44,67,524,72,8,fill=1,stroke=0)
paragraph("A good first job",60,124,492,11,15,INK,True)
paragraph("Start with repeat production, stable drawings, clear material and inspection requirements, and sufficient lead time. This frees your own floor for urgent or complex work.",60,102,492,10.5,15)
c.setFillColor(MUTED)
c.setFont("Lattice",8.5)
c.drawString(44,40,"latticeos.co/how-it-works")
c.linkURL("https://latticeos.co/how-it-works",(44,37,168,49),relative=0)
c.drawRightString(568,40,"support@latticeos.co")
c.linkURL("mailto:support@latticeos.co",(463,37,568,49),relative=0)
c.save()
print(OUTPUT)
