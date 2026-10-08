"""Build the redesigned invitation attachment, using approved brand artwork."""
from pathlib import Path
import os

from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output/pdf/lattice-invitation-overview.pdf"
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
c.setStrokeColor(RULE)
c.line(44, 711, 568, 711)

# A benefit-led introduction, followed by the approved invitation illustration.
paragraph("Take on the work.<br/>Keep your floor focused.",44,704,524,28,30,INK,True)
paragraph("Lattice helps domestic machine shops fulfill overflow and out-of-capability jobs through qualified CNC machining and fabrication partners in China. Access additional production capacity without adding machines, staff or floor space.",44,633,524,11,15)
# Reduce the banner's height by cropping excess sky, preserving the actual artwork.
c.saveState()
clip=c.beginPath()
clip.rect(44,442,524,135)
c.clipPath(clip,stroke=0,fill=0)
c.drawImage(str(ROOT / "public/email/lattice-invitation-banner.png"),44,421,width=524,height=524/3,mask="auto")
c.restoreState()

# Source: normalized equipment catalog and network-scale source notes.
label("ACROSS OUR PARTNER MANUFACTURING NETWORK",44,94)
for x,value,caption in [(44,"335","documented CNC machines; 109 are 5-axis"),(322,"590+","personnel reported by two partners")]:
    paragraph(value,x,77,246,21,23,INK,True)
    paragraph(caption,x,48,246,8.5,11)

label("ONE PARTNER, FROM REQUEST TO DELIVERY",44,303)
# Recreate the website's flowing journey as crisp PDF vector artwork.
centers=[106,239,372,505]
y=249
c.setStrokeColor(HexColor("#788b9e"))
c.setLineWidth(1)
path=c.beginPath()
path.moveTo(44,y)
path.lineTo(centers[0],y)
for start,end in zip(centers,centers[1:]):
    path.curveTo(start+43,y-9,end-43,y-9,end,y)
path.lineTo(568,y)
c.drawPath(path)
c.line(560,y+3,568,y)
c.line(560,y-3,568,y)
for index,x in enumerate(centers,1):
    c.setFillColor(HexColor("#ffffff"))
    c.circle(x,y,14,fill=1,stroke=1)
    c.setFillColor(INK)
    c.setFont("LatticeBold",11)
    c.drawCentredString(x,y-4,str(index))

steps = [
    ("Share requirements", "Upload drawings and CAD files. Specify quantities, material and quality requirements, and your target delivery date."),
    ("Review the quote", "Review the quote provided by our manufacturing partners based on your project requirements and their capacity."),
    ("Approve production", "Lattice coordinates with the supplier and tracks progress against the agreed production plan."),
    ("Review quality", "Review inspection and material records against your requirements before shipment."),
]
for x,(title,copy) in zip([44,177,310,443],steps):
    paragraph(title,x,219,125,11,15,INK,True)
    paragraph(copy,x,195,125,10,14)

c.setStrokeColor(RULE)
c.line(44,318,568,318)
label("YOUR SHOP. MORE POSSIBILITIES.",44,422)
benefits = [
    ("Keep the customer relationship", "With a full pipeline, shops either reject work or bid excessively long lead times. Route overflow work through Lattice and keep the customer relationship."),
    ("Quote beyond your current capacity", "Offer customers machining and fabrication capabilities beyond the equipment, materials or labor available in your shop."),
]
for x,(title,copy) in zip([44,322],benefits):
    paragraph(title,x,407,246,12,15,INK,True)
    paragraph(copy,x,382,246,10,14)

c.setStrokeColor(RULE)
c.line(44,34,568,34)
c.setFillColor(MUTED)
c.setFont("Lattice",7.5)
c.drawString(44,22,"latticeos.co")
c.linkURL("https://latticeos.co",(44,19,85,30),relative=0)
c.drawRightString(568,22,"Manufacturing capacity, managed by Lattice.")
c.save()
print(OUTPUT)
