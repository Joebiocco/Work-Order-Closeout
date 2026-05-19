"""
Generate NJDOT Field Tools PWA icons using Pillow.
Produces:
  icon-192.png       — standard icon with safe-zone padding
  icon-512.png       — standard icon with safe-zone padding
  icon-512-maskable.png — maskable/adaptive: bridge fills edge-to-edge
  icon.svg           — canonical SVG source (hand-crafted)

Design:
  Background: #1e2939 (dark navy), full bleed
  Arch:       #E5B33B (saffron gold) suspension bridge silhouette
  Style:      geometric, bold, no text
"""

import math
from PIL import Image, ImageDraw

BG      = (30, 41, 57)      # #1e2939
GOLD    = (229, 179, 59)    # #E5B33B
GOLD_DK = (180, 130, 30)    # darker gold for cables
WATER   = (38, 55, 78)      # subtle water tint #26374E

def draw_icon(size, padded=True):
    """
    Draw a single icon at `size` x `size` pixels.
    padded=True  -> 12% safe-zone inset on all sides (standard icon)
    padded=False -> bridge fills full canvas edge-to-edge (maskable)

    Layout in normalised 0-1000 space:
      - Safe zone: [120, 880] when padded, [30, 970] when maskable
      - Bridge is vertically centred in the safe zone with slight upward
        bias (optical centre). Deck sits at ~58% of the safe-zone height.
      - Towers are tall relative to the midspan (≈70% of bridge height).
      - Main cable sags to ~90% of tower height.
      - Anchor cables run straight-ish from tower tops diagonally to the
        deck ends — NO downward control-point below the endpoint.
    """
    img = Image.new("RGBA", (size, size), BG)
    d   = ImageDraw.Draw(img)

    S = size / 1000.0
    def px(x): return x * S
    def py(y): return y * S
    def sc(v): return v * S

    # ── Safe zone ──────────────────────────────────────────────────────
    if padded:
        inset = 0.12
    else:
        inset = 0.03

    L  = inset * 1000          # left edge of safe zone
    R  = (1 - inset) * 1000   # right edge
    T  = inset * 1000          # top edge
    B  = (1 - inset) * 1000   # bottom edge
    W  = R - L                 # safe-zone width
    H  = B - T                 # safe-zone height
    CX = (L + R) / 2           # horizontal center

    # ── Key vertical landmarks ─────────────────────────────────────────
    # We want the visual centre of the bridge (halfway between tower tops
    # and deck) to sit at approximately 48% of the safe zone — slightly
    # above true centre for optical balance.
    #
    # Bridge occupies 70% of safe-zone height:
    #   tower_top at  T + H*0.13  = 13% from top
    #   deck       at  T + H*0.83  = 83% from top
    #   visual mid = 48%  ✓
    # That leaves 13% margin above towers and 17% below deck for water+room.
    deck_y      = T + H * 0.80
    tower_top_y = T + H * 0.10
    bridge_h    = deck_y - tower_top_y

    # ── Tower geometry ─────────────────────────────────────────────────
    tower_w   = W * 0.060          # column width — slightly bolder
    tower_gap = W * 0.36           # inner-edge gap — tighter span, less M-shape

    lt_inner = CX - tower_gap / 2
    lt_outer = lt_inner - tower_w
    rt_inner = CX + tower_gap / 2
    rt_outer = rt_inner + tower_w

    tower_color = GOLD

    # Shafts
    d.rectangle([px(lt_outer), py(tower_top_y), px(lt_inner), py(deck_y)], fill=tower_color)
    d.rectangle([px(rt_inner), py(tower_top_y), px(rt_outer), py(deck_y)], fill=tower_color)

    # Crossbeams — two per tower at 25% and 52% of tower height
    xb_h   = bridge_h * 0.038     # slightly taller for 192px legibility
    xb_ext = tower_w * 1.1        # extends clearly beyond shaft
    for yf in [0.25, 0.52]:
        xby = tower_top_y + bridge_h * yf
        d.rectangle([px(lt_outer - xb_ext), py(xby),
                     px(lt_inner + xb_ext), py(xby + xb_h)], fill=tower_color)
        d.rectangle([px(rt_inner - xb_ext), py(xby),
                     px(rt_outer + xb_ext), py(xby + xb_h)], fill=tower_color)

    # Caps — slightly wider block at the very top
    cap_h   = bridge_h * 0.04
    cap_ext = tower_w * 0.35
    d.rectangle([px(lt_outer - cap_ext), py(tower_top_y - cap_h),
                 px(lt_inner + cap_ext), py(tower_top_y)], fill=tower_color)
    d.rectangle([px(rt_inner - cap_ext), py(tower_top_y - cap_h),
                 px(rt_outer + cap_ext), py(tower_top_y)], fill=tower_color)

    # ── Cable geometry ─────────────────────────────────────────────────
    cable_thick = max(2, round(sc(7)))

    # Main span cable attachment: inner face of each tower, near cap top.
    # Using the INNER edge so the main cable clearly spans between towers.
    main_lx = lt_inner
    main_rx = rt_inner
    cable_y = tower_top_y + cap_h * 0.5   # attach mid-cap height

    # For a symmetric quadratic bezier, the curve only reaches HALFWAY to
    # the control point at t=0.5. So to get the cable to visually SAG to
    # `sag_y`, the control point must be at:  cp_y = 2*sag_y - cable_y
    # Target visual sag: 55% of bridge_h — cable midpoint at ~half tower height,
    # classic suspension bridge silhouette (not too shallow, not too droopy)
    visual_sag_y = tower_top_y + bridge_h * 0.55
    cp_sag_y     = 2 * visual_sag_y - cable_y   # corrected control point

    def draw_bezier(x1, y1, cpx, cpy, x2, y2, color, width, steps=100):
        """Draw quadratic bezier as a polyline."""
        pts = []
        for i in range(steps + 1):
            t  = i / steps
            bx = (1-t)**2 * x1 + 2*t*(1-t)*cpx + t**2 * x2
            by = (1-t)**2 * y1 + 2*t*(1-t)*cpy + t**2 * y2
            pts.append((px(bx), py(by)))
        d.line(pts, fill=color, width=width)

    # Main span cable with corrected control point depth
    draw_bezier(main_lx, cable_y, CX, cp_sag_y, main_rx, cable_y, GOLD, cable_thick)

    # Also update hangers to use the corrected sag value
    sag_y = cp_sag_y   # hangers sample this bezier, so use same CP

    # Anchor cables: pure straight lines from outer tower face to deck ends.
    # Straight lines (not beziers) guarantee no kink or loop artefacts.
    anc_origin_lx = lt_outer
    anc_origin_rx = rt_outer
    anc_y0 = cable_y

    anchor_lx = L + W * 0.04
    anchor_rx = R - W * 0.04
    anchor_y  = deck_y

    d.line([(px(anc_origin_lx), py(anc_y0)), (px(anchor_lx), py(anchor_y))],
           fill=GOLD, width=cable_thick)
    d.line([(px(anc_origin_rx), py(anc_y0)), (px(anchor_rx), py(anchor_y))],
           fill=GOLD, width=cable_thick)

    # ── Vertical hangers ───────────────────────────────────────────────
    # Evenly spaced across the main span, from cable down to deck
    hanger_color = (*GOLD_DK, 210)
    hanger_thick = max(1, round(sc(3.5)))
    n_hangers = 8

    hanger_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    hd = ImageDraw.Draw(hanger_layer)
    for i in range(1, n_hangers + 1):
        t  = i / (n_hangers + 1)
        # Point on main cable bezier (uses main_lx/main_rx to match cable)
        hx = (1-t)**2 * main_lx + 2*t*(1-t)*CX    + t**2 * main_rx
        hy = (1-t)**2 * cable_y + 2*t*(1-t)*sag_y + t**2 * cable_y
        hd.line([(px(hx), py(hy)), (px(hx), py(deck_y))],
                fill=hanger_color, width=hanger_thick)
    img = Image.alpha_composite(img, hanger_layer)
    d = ImageDraw.Draw(img)

    # ── Road deck ──────────────────────────────────────────────────────
    # Deck spans from anchor endpoint to anchor endpoint (not full safe zone)
    deck_thick = max(2, round(sc(10)))
    d.line([(px(anchor_lx), py(deck_y)), (px(anchor_rx), py(deck_y))],
           fill=GOLD, width=deck_thick)

    # ── Water reflections (below deck) ─────────────────────────────────
    # Three progressively narrower, more transparent lines below the deck
    wlayer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    wd = ImageDraw.Draw(wlayer)
    for i, (wc, w_thick, inset_frac) in enumerate([
        ((52, 80, 115, 160), 5.0, 0.06),
        ((52, 80, 115,  90), 3.5, 0.12),
        ((52, 80, 115,  45), 2.5, 0.19),
    ]):
        wy  = deck_y + sc(22 + i * 22)
        wlx = L + W * inset_frac
        wrx = R - W * inset_frac
        wd.line([(px(wlx), py(wy)), (px(wrx), py(wy))],
                fill=wc, width=max(1, round(sc(w_thick))))
    img = Image.alpha_composite(img, wlayer)
    d = ImageDraw.Draw(img)

    return img


def build_svg():
    """
    SVG source mirroring the final Pillow geometry exactly (padded=True).

    Key values (0-1000 viewBox, safe zone [120,880], W=H=760, CX=500):
      deck_y=728  tower_top_y=196  bridge_h=532
      tower_w=45.6  tower_gap=273.6
      lt_outer=317.6  lt_inner=363.2
      rt_inner=636.8  rt_outer=682.4
      cap_h=21.3  cable_y=206.6
      visual_sag_y=488.6  cp_sag_y=770.6 (corrected control point)
      anchor endpoints: (150,728) and (850,728)
    """
    svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"
     width="512" height="512">
  <title>NJDOT Field Tools</title>
  <desc>Dark navy background, saffron gold suspension bridge — geometric, no text</desc>

  <!-- Background -->
  <rect width="1000" height="1000" fill="#1e2939"/>

  <!-- Left tower shaft  x=317.6  y=196  w=45.6  h=532 -->
  <rect x="318" y="196" width="46" height="532" fill="#E5B33B"/>
  <!-- Right tower shaft  x=636.8  y=196  w=45.6  h=532 -->
  <rect x="637" y="196" width="46" height="532" fill="#E5B33B"/>

  <!-- Tower caps  (cap_h=21, cap_ext=16 → total width = 46+32=78) -->
  <rect x="302" y="175" width="78" height="21" fill="#E5B33B"/>
  <rect x="621" y="175" width="78" height="21" fill="#E5B33B"/>

  <!-- Crossbeams at 25% (y=329) and 52% (y=473) of bridge_h
       width = tower_w + 2*xb_ext = 46 + 2*50 = 146, centred on tower -->
  <rect x="245" y="329" width="146" height="20" fill="#E5B33B"/>
  <rect x="245" y="473" width="146" height="20" fill="#E5B33B"/>
  <rect x="610" y="329" width="146" height="20" fill="#E5B33B"/>
  <rect x="610" y="473" width="146" height="20" fill="#E5B33B"/>

  <!-- Main span cable: M(363,207) Q(500,771) (637,207)
       Control point is corrected so visual midpoint lands at y≈489 (55% of bridge_h) -->
  <path d="M 363 207 Q 500 771 637 207"
        fill="none" stroke="#E5B33B" stroke-width="7" stroke-linecap="round"/>

  <!-- Anchor cables: straight lines from outer tower face to deck endpoints -->
  <line x1="318" y1="207" x2="150" y2="728" stroke="#E5B33B" stroke-width="7" stroke-linecap="round"/>
  <line x1="683" y1="207" x2="850" y2="728" stroke="#E5B33B" stroke-width="7" stroke-linecap="round"/>

  <!-- Hangers: 8 evenly spaced (t=1/9..8/9) along main cable, bottom at deck y=728 -->
  <line x1="394" y1="318" x2="394" y2="728" stroke="#B4821E" stroke-width="3.5" stroke-opacity="0.82"/>
  <line x1="424" y1="402" x2="424" y2="728" stroke="#B4821E" stroke-width="3.5" stroke-opacity="0.82"/>
  <line x1="454" y1="457" x2="454" y2="728" stroke="#B4821E" stroke-width="3.5" stroke-opacity="0.82"/>
  <line x1="485" y1="485" x2="485" y2="728" stroke="#B4821E" stroke-width="3.5" stroke-opacity="0.82"/>
  <line x1="515" y1="485" x2="515" y2="728" stroke="#B4821E" stroke-width="3.5" stroke-opacity="0.82"/>
  <line x1="546" y1="457" x2="546" y2="728" stroke="#B4821E" stroke-width="3.5" stroke-opacity="0.82"/>
  <line x1="576" y1="402" x2="576" y2="728" stroke="#B4821E" stroke-width="3.5" stroke-opacity="0.82"/>
  <line x1="606" y1="318" x2="606" y2="728" stroke="#B4821E" stroke-width="3.5" stroke-opacity="0.82"/>

  <!-- Road deck: anchor-to-anchor width at y=728 -->
  <line x1="150" y1="728" x2="850" y2="728" stroke="#E5B33B" stroke-width="10" stroke-linecap="round"/>

  <!-- Water reflections below deck -->
  <line x1="166" y1="750" x2="834" y2="750" stroke="#344F72" stroke-width="5" stroke-opacity="0.63"/>
  <line x1="177" y1="772" x2="823" y2="772" stroke="#344F72" stroke-width="3.5" stroke-opacity="0.35"/>
  <line x1="191" y1="794" x2="809" y2="794" stroke="#344F72" stroke-width="2.5" stroke-opacity="0.20"/>
</svg>'''
    return svg


if __name__ == "__main__":
    import os
    out_dir = os.path.dirname(os.path.abspath(__file__))

    # Standard icons (with safe-zone padding)
    for size, name in [(192, "icon-192.png"), (512, "icon-512.png")]:
        img = draw_icon(size, padded=True)
        path = os.path.join(out_dir, name)
        img.save(path, "PNG")
        print(f"Wrote {path}  ({size}x{size})")

    # Maskable icon (fills full canvas, no padding)
    img_m = draw_icon(512, padded=False)
    path_m = os.path.join(out_dir, "icon-512-maskable.png")
    img_m.save(path_m, "PNG")
    print(f"Wrote {path_m}  (512x512 maskable)")

    # SVG source
    svg_path = os.path.join(out_dir, "icon.svg")
    with open(svg_path, "w", encoding="utf-8") as f:
        f.write(build_svg())
    print(f"Wrote {svg_path}")

    print("Done.")
