"""Build the ECXC tile-grid mark: four rounded square tiles, one Nunito
ExtraBold letter knocked out of each.

This is the classic tile solution to the four-letters-in-a-square problem
(the grid is carried by square containers, so the letters keep their natural
Nunito proportions; no stretching, no custom type). Knockouts are computed
as real boolean differences, so there are no winding artifacts.

Outputs nav-lockup.svg, favicon.svg, crest.svg.
"""

from fontTools.misc.transform import Transform
from fontTools.pens.basePen import BasePen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from shapely.geometry import Polygon, box
from shapely.ops import unary_union
from shapely import affinity
import math

CELL, GUT = 48.0, 4.0
STEP = CELL + GUT
RX = 5.0         # tile corner radius (sharp enough to escape bubble-letter territory)
CAP = 35.0       # letter cap height inside the tile (73% of cell: legible at nav size)
NUNITO_CAP = 705.0  # Nunito cap height in font units at wght 800

FIREWEED = "oklch(66% 0.21 357)"
SPRUCE = "oklch(25% 0.035 175)"

font = instantiateVariableFont(TTFont("Nunito.ttf"), {"wght": 800}, inplace=False)
GS, CM = font.getGlyphSet(), font.getBestCmap()


class PolyPen(BasePen):
    """Flattens a glyph into shapely Polygons (12 samples per curve)."""

    def __init__(self, glyphSet):
        super().__init__(glyphSet)
        self.contours, self._pts = [], []

    def _moveTo(self, pt):
        self._pts = [pt]

    def _lineTo(self, pt):
        self._pts.append(pt)

    def _qCurveToOne(self, p1, p2):
        p0 = self._pts[-1]
        for i in range(1, 13):
            t = i / 12
            x = (1-t)**2*p0[0] + 2*(1-t)*t*p1[0] + t*t*p2[0]
            y = (1-t)**2*p0[1] + 2*(1-t)*t*p1[1] + t*t*p2[1]
            self._pts.append((x, y))

    def _curveToOne(self, p1, p2, p3):
        p0 = self._pts[-1]
        for i in range(1, 13):
            t = i / 12
            mt = 1 - t
            x = mt**3*p0[0] + 3*mt*mt*t*p1[0] + 3*mt*t*t*p2[0] + t**3*p3[0]
            y = mt**3*p0[1] + 3*mt*mt*t*p1[1] + 3*mt*t*t*p2[1] + t**3*p3[1]
            self._pts.append((x, y))

    def _closePath(self):
        if len(self._pts) >= 3:
            self.contours.append(Polygon(self._pts))
        self._pts = []


def glyph_poly(ch, cap, cx, cy):
    """Letter as a shapely geometry, ink-centered at (cx, cy).

    E, C, X have no counters, so a plain union of contours is the correct
    nonzero fill (overlap artifacts from instancing union away)."""
    pen = PolyPen(GS)
    GS[CM[ord(ch)]].draw(pen)
    g = unary_union([p if p.is_valid else p.buffer(0) for p in pen.contours])
    s = cap / NUNITO_CAP
    g = affinity.scale(g, s, -s, origin=(0, 0))
    minx, miny, maxx, maxy = g.bounds
    return affinity.translate(g, cx - (minx + maxx) / 2, cy - (miny + maxy) / 2)


def rounded_tile(x, y):
    return box(x + RX, y + RX, x + CELL - RX, y + CELL - RX).buffer(RX, quad_segs=8)


def num(v):
    s = f"{v:.2f}".rstrip("0").rstrip(".")
    return "0" if s == "-0" else s


def to_path(geom):
    polys = getattr(geom, "geoms", [geom])
    parts = []
    for poly in polys:
        for ring in [poly.exterior, *poly.interiors]:
            pts = list(ring.coords)[:-1]
            parts.append("M" + "L".join(f"{num(x)} {num(y)}" for x, y in pts) + "Z")
    return "".join(parts)


LAYOUT = (("E", 0, 0), ("C", 1, 0), ("X", 0, 1), ("C", 1, 1))


def tile_cells():
    cells = []
    for ch, col, row in LAYOUT:
        x, y = col * STEP, row * STEP
        tile = rounded_tile(x, y)
        letter = glyph_poly(ch, CAP, x + CELL / 2, y + CELL / 2)
        cells.append(tile.difference(letter).simplify(0.05))
    return cells


cells = tile_cells()
paths = [to_path(c) for c in cells]

with open("nav-lockup.svg", "w") as f:
    f.write('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" '
            'fill="currentColor">\n')
    for d in paths:
        f.write(f'  <path d="{d}" />\n')
    f.write("</svg>\n")

# favicon: the four-tile primary cut on a spruce field. The tile geometry
# carries the brand at sizes where letters become texture; at 16px it
# reads as a crisp pink tile cluster where letter-only cuts turn to mush.
inset = 8.0
fs = (64 - 2 * inset) / 100
favicon = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">',
    "  <!-- ECXC four-tile mark on a spruce field. Glyph paths are a copy of"
    " the nav mark in src/theme/components/SiteHeader.svelte; colors mirror the"
    " header (spruce) and display fireweed tokens in src/theme/ecxc-theme.css. -->",
    f'  <rect width="64" height="64" rx="14" fill="{SPRUCE}" />',
    f'  <g transform="translate({num(inset)} {num(inset)}) scale({num(fs)})" '
    f'fill="{FIREWEED}">',
]
favicon += [f'    <path d="{d}" />' for d in paths]
favicon += ["  </g>", "</svg>"]
with open("favicon.svg", "w") as f:
    f.write("\n".join(favicon) + "\n")

# crest: tile monogram in the ring
ring_font = instantiateVariableFont(TTFont("AlumniSans.ttf"), {"wght": 700}, inplace=False)
RG, RC = ring_font.getGlyphSet(), ring_font.getBestCmap()
ARC_SIZE, TRACK = 21.0, 4.0
arc_s = ARC_SIZE / ring_font["head"].unitsPerEm
CX = CY = 120.0


def ring_glyph(ch, t):
    pen = SVGPathPen(RG, ntos=num)
    RG[RC[ord(ch)]].draw(TransformPen(pen, t))
    return pen.getCommands()


def arc_text(text, radius, top):
    widths = [RG[RC[ord(ch)]].width * arc_s for ch in text]
    total = sum(widths) + TRACK * (len(text) - 1)
    out, cum = [], 0.0
    for ch, w in zip(text, widths):
        if ch != " ":
            phi = (cum + w / 2 - total / 2) / radius
            c_, s_ = math.cos(phi), math.sin(phi)
            if top:
                t = Transform(c_, s_, s_, -c_, CX + radius * s_, CY - radius * c_)
            else:
                t = Transform(c_, -s_, -s_, -c_, CX + radius * s_, CY + radius * c_)
            out.append(ring_glyph(ch, t.transform(Transform(arc_s, 0, 0, arc_s, -w / 2, 0))))
        cum += w + TRACK
    return out


G = 60.0
gs_ = G / 100.0
crest_grid = [affinity.translate(affinity.scale(c, gs_, gs_, origin=(0, 0)),
                                 CX - G / 2, CY - G / 2) for c in cells]
crest_body = [
    '<circle cx="120" cy="120" r="114" fill="none" stroke="currentColor" stroke-width="6"/>',
    '<circle cx="120" cy="120" r="98" fill="none" stroke="currentColor" stroke-width="1.8"/>',
    '<circle cx="120" cy="120" r="62" fill="none" stroke="currentColor" stroke-width="1.8"/>',
    '<rect x="36" y="116" width="8" height="8" transform="rotate(45 40 120)" fill="currentColor"/>',
    '<rect x="196" y="116" width="8" height="8" transform="rotate(45 200 120)" fill="currentColor"/>',
]
crest_body += [f'<path d="{d}" fill="currentColor"/>' for d in arc_text("EAST COMMUNITY", 70, True)]
crest_body += [f'<path d="{d}" fill="currentColor"/>' for d in arc_text("CROSS COUNTRY", 88, False)]
crest_body += [f'<path d="{to_path(g)}" fill="currentColor"/>' for g in crest_grid]

with open("crest.svg", "w") as f:
    f.write('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">\n')
    f.write("  <!-- ECXC club crest: the tile monogram in the ring, Alumni Sans\n"
            "       Bold arc text, all outlines. currentColor. -->\n")
    for el in crest_body:
        f.write(f"  {el}\n")
    f.write("</svg>\n")

print("wrote nav-lockup.svg favicon.svg crest.svg")

# Regenerating: needs fontTools + shapely (venv) and two variable fonts from
# google/fonts: Nunito[wght].ttf (the letterforms; the site's own display
# face) and AlumniSans[wght].ttf (crest ring text only).
