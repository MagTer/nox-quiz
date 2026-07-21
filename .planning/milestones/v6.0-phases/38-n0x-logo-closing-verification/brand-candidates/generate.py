#!/usr/bin/env python3
"""Generate n0x logo candidates (BRAND-01 exploration) in the Nox Run grunge palette.
Uses the vendored monogram pixel font; NEAREST upscale keeps crisp blocky pixels.
Output: 6 preview PNGs (each on a dark title-like backing) + a transparent hero of each."""
import os, random
from PIL import Image, ImageDraw, ImageFont, ImageFilter

random.seed(20260719)
ROOT = "/home/magnus/dev/nox-quiz"
OUT = "/tmp/claude-1000/-home-magnus-dev-nox-quiz/f4ca9797-1c9b-4234-a894-d38481d0d77e/scratchpad/n0x"
os.makedirs(OUT, exist_ok=True)
FONT = os.path.join(ROOT, "assets/_font-src/monogram.ttf")

# palette (from CONFIG.PALETTE)
BG        = (0x0a, 0x0a, 0x0a)
SURFACE   = (20, 20, 20)
MOSS      = (0x47, 0x68, 0x47)
REWARD    = (0x00, 0xff, 0x88)
TEXT      = (0xe8, 0xe8, 0xe8)
TEXT_DIM  = (0x88, 0x88, 0x88)
RUST      = (0x8c, 0x50, 0x36)
EMBER     = (0xa8, 0x50, 0x2c)
STEEL     = (0x52, 0x5e, 0x82)
BORDER    = (0x5e, 0x5e, 0x5e)

SCALE = 6          # NEAREST upscale factor
FS    = 48         # base font size (rendered small, upscaled)

def render_text(txt, fill, size=FS):
    font = ImageFont.truetype(FONT, size)
    bb = font.getbbox(txt)
    w, h = bb[2]-bb[0]+4, bb[3]-bb[1]+4
    im = Image.new("RGBA", (w, h), (0,0,0,0))
    d = ImageDraw.Draw(im)
    d.text((2-bb[0], 2-bb[1]), txt, font=font, fill=fill+(255,))
    return im

def outline(layer, color, px=1):
    """Return an outline mask layer of `layer`'s alpha, dilated by px, in `color`."""
    a = layer.split()[3]
    grow = a
    for _ in range(px):
        grow = grow.filter(ImageFilter.MaxFilter(3))
    o = Image.new("RGBA", layer.size, (0,0,0,0))
    o.paste(color+(255,), (0,0), grow)
    return o

def upscale(im):
    return im.resize((im.width*SCALE, im.height*SCALE), Image.NEAREST)

def grunge(im, scan=True, speckle=0.02, dark=True):
    """Add faint scanlines + noise speckle over opaque pixels only (keeps it tasteful)."""
    im = im.convert("RGBA")
    px = im.load()
    w,h = im.size
    for y in range(h):
        for x in range(w):
            r,g,b,a = px[x,y]
            if a == 0: continue
            if scan and (y % 3 == 0) and dark:
                r,g,b = int(r*0.78), int(g*0.78), int(b*0.78)
            if random.random() < speckle:
                f = 0.6 if random.random()<0.5 else 1.25
                r,g,b = min(255,int(r*f)), min(255,int(g*f)), min(255,int(b*f))
            px[x,y] = (r,g,b,a)
    return im

def backing(w, h, base=BG, vignette=True):
    im = Image.new("RGBA", (w,h), base+(255,))
    if vignette:
        d = ImageDraw.Draw(im)
        for i in range(6):
            a = 8
            d.rectangle([i,i,w-1-i,h-1-i], outline=(0,0,0,a))
    # faint scanlines on the plate
    px = im.load()
    for y in range(0,h,3):
        for x in range(w):
            r,g,b,a = px[x,y]; px[x,y]=(max(0,r-4),max(0,g-4),max(0,b-4),a)
    return im

def compose_hero(fg_small, pad=10):
    """Upscale a small RGBA mark and center it on a dark title backing (~480x150)."""
    fg = upscale(fg_small)
    W, H = 520, 170
    bk = backing(W, H)
    bk.alpha_composite(fg, ((W-fg.width)//2, (H-fg.height)//2))
    return bk

def save(mark_small, name, grunge_bg=True, **gk):
    hero = compose_hero(mark_small)
    if grunge_bg:
        hero = grunge(hero, **gk)
    hero.save(os.path.join(OUT, f"{name}.png"))
    upscale(mark_small).save(os.path.join(OUT, f"{name}-hero-transparent.png"))
    print("wrote", name)

# ---- 1. HERITAGE — moss fill + neon-green outline, lowercase n0x (brand continuity) ----
def c_heritage():
    base = render_text("n0x", MOSS)
    canvas = Image.new("RGBA", base.size, (0,0,0,0))
    canvas.alpha_composite(outline(base, REWARD, 1))
    canvas.alpha_composite(base)
    save(canvas, "1-heritage")

# ---- 2. EMBER — rust fill + ember outline + faint glow, lowercase (harsh late-biome) ----
def c_ember():
    base = render_text("n0x", RUST)
    glow = outline(base, EMBER, 2).filter(ImageFilter.GaussianBlur(1))
    canvas = Image.new("RGBA", base.size, (0,0,0,0))
    canvas.alpha_composite(glow)
    canvas.alpha_composite(outline(base, EMBER, 1))
    canvas.alpha_composite(base)
    save(canvas, "2-ember")

# ---- 3. STEEL — steel-blue fill + thin bone outline, uppercase N0X (cold/clean) ----
def c_steel():
    base = render_text("N0X", STEEL)
    canvas = Image.new("RGBA", base.size, (0,0,0,0))
    canvas.alpha_composite(outline(base, TEXT, 1))
    canvas.alpha_composite(base)
    save(canvas, "3-steel", speckle=0.012)

# ---- 4. MONO-GRUNGE — bone-white, heavy scanline + drop shadow, uppercase (most grunge) ----
def c_mono():
    base = render_text("N0X", TEXT)
    shadow = Image.new("RGBA", (base.width+3, base.height+3), (0,0,0,0))
    sh = outline(base, (0,0,0), 1)
    shadow.alpha_composite(sh, (3,3))
    shadow.alpha_composite(base, (0,0))
    save(shadow, "4-mono-grunge", speckle=0.05)

# ---- 5. NEON-ZERO — muted n & x, the 0 is neon-green hero (zero = the brand hook) ----
def c_neon_zero():
    font = ImageFont.truetype(FONT, FS)
    adv = font.getlength("0")
    parts = [("n", TEXT_DIM), ("0", REWARD), ("x", TEXT_DIM)]
    total_w = int(adv*3)+6
    bb = font.getbbox("0"); h = bb[3]-bb[1]+6
    base = Image.new("RGBA", (total_w, h), (0,0,0,0))
    d = ImageDraw.Draw(base)
    x = 3
    zero_layer = None
    for ch, col in parts:
        d.text((x, 3-bb[1]), ch, font=font, fill=col+(255,))
        if ch == "0":
            zl = Image.new("RGBA", base.size, (0,0,0,0))
            ImageDraw.Draw(zl).text((x,3-bb[1]), ch, font=font, fill=REWARD+(255,))
            zero_layer = zl
        x += int(adv)
    # glow behind the zero only
    glow = outline(zero_layer, REWARD, 2).filter(ImageFilter.GaussianBlur(2))
    canvas = Image.new("RGBA", base.size, (0,0,0,0))
    canvas.alpha_composite(glow); canvas.alpha_composite(base)
    save(canvas, "5-neon-zero", speckle=0.02)

# ---- 6. STAMP BADGE — n0x in a distressed metal plate (the select-badge direction) ----
def c_stamp():
    mark = render_text("n0x", TEXT, size=40)
    mark_o = Image.new("RGBA", mark.size, (0,0,0,0))
    mark_o.alpha_composite(outline(mark, (0,0,0), 1)); mark_o.alpha_composite(mark)
    padx, pady = 16, 10
    W, H = mark_o.width+padx*2, mark_o.height+pady*2
    plate = Image.new("RGBA", (W,H), SURFACE+(255,))
    d = ImageDraw.Draw(plate)
    d.rectangle([0,0,W-1,H-1], outline=BORDER+(255,), width=2)
    d.rectangle([3,3,W-4,H-4], outline=(MOSS)+(255,), width=1)
    # rivets
    for cx,cy in [(6,6),(W-7,6),(6,H-7),(W-7,H-7)]:
        d.ellipse([cx-1,cy-1,cx+1,cy+1], fill=BORDER+(255,))
    plate.alpha_composite(mark_o, (padx, pady))
    # this candidate: the plate IS the mark, so upscale the plate directly
    hero = upscale(plate)
    W2,H2 = 520,170
    bk = backing(W2,H2)
    bk.alpha_composite(hero, ((W2-hero.width)//2,(H2-hero.height)//2))
    bk = grunge(bk, speckle=0.03)
    bk.save(os.path.join(OUT, "6-stamp-badge.png"))
    upscale(plate).save(os.path.join(OUT,"6-stamp-badge-hero-transparent.png"))
    print("wrote 6-stamp-badge")

c_heritage(); c_ember(); c_steel(); c_mono(); c_neon_zero(); c_stamp()
print("\nAll candidates in", OUT)
for f in sorted(os.listdir(OUT)):
    if f.endswith(".png") and "transparent" not in f:
        print(" ", f)
