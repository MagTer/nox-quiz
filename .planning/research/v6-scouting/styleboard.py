#!/usr/bin/env python3
# v6.0 style board — compose 4 biome mock screens (640x360, game proportions)
# from the scouted Gothicvania packs. Pure Pillow, no numpy.
import os
from PIL import Image

REPO = "/home/magnus/dev/nox-quiz"
# Gitignored source packs (Plan 31-01) live per-checkout, not at the hardcoded
# REPO path — a git worktree checks them out at a different filesystem root
# than REPO. Derive ROOT from this script's own location (3 dirs up from
# .planning/research/v6-scouting/) so it resolves correctly in any worktree,
# same as OUT already does below.
ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "assets", "_gothicvania-src"))
OUT = os.path.dirname(os.path.abspath(__file__)) + "/board"
os.makedirs(OUT, exist_ok=True)

W, H = 640, 360
FLOOR_Y = 320  # game's floor-top line

def load(p):
    return Image.open(os.path.join(ROOT, p)).convert("RGBA")

def islands(im, min_px=40):
    """Connected components on alpha>0; returns list of cropped islands, biggest first."""
    w, h = im.size
    px = im.load()
    seen = [[False] * w for _ in range(h)]
    out = []
    for y0 in range(h):
        for x0 in range(w):
            if seen[y0][x0] or px[x0, y0][3] == 0:
                seen[y0][x0] = True
                continue
            stack = [(x0, y0)]
            seen[y0][x0] = True
            xs, ys = [], []
            while stack:
                x, y = stack.pop()
                xs.append(x); ys.append(y)
                for nx, ny in ((x+1,y),(x-1,y),(x,y+1),(x,y-1),(x+1,y+1),(x-1,y-1),(x+1,y-1),(x-1,y+1)):
                    if 0 <= nx < w and 0 <= ny < h and not seen[ny][nx]:
                        seen[ny][nx] = True
                        if px[nx, ny][3] > 0:
                            stack.append((nx, ny))
            if len(xs) >= min_px:
                box = (min(xs), min(ys), max(xs) + 1, max(ys) + 1)
                out.append(im.crop(box))
    out.sort(key=lambda i: i.width * i.height, reverse=True)
    return out

def tile_x(canvas, im, bottom, x0=0):
    """Tile im horizontally across canvas with its bottom edge at `bottom`."""
    y = bottom - im.height
    x = x0
    while x < canvas.width:
        canvas.alpha_composite(im, (x, y))
        x += im.width

def stretch_top(canvas, im, y_top_of_im):
    """Fill rows 0..y_top_of_im by repeating im's top row (sky padding)."""
    if y_top_of_im <= 0:
        return
    row = im.crop((0, 0, im.width, 1)).resize((canvas.width, 1))
    for y in range(0, y_top_of_im):
        canvas.alpha_composite(row, (0, y))

def hue_shift_band(im, band_lo, band_hi, delta, min_sat=30):
    """Rotate hue by `delta` for pixels whose hue is in [band_lo, band_hi] (PIL 0-255 hue).
    Demo of the v6.0 palette-conform pass (no-pink rule) on sourced art."""
    rgba = im.convert("RGBA")
    a = rgba.getchannel("A")
    hsv = rgba.convert("RGB").convert("HSV")
    px = hsv.load()
    w, h = hsv.size
    for y in range(h):
        for x in range(w):
            hh, s, v = px[x, y]
            if s >= min_sat and band_lo <= hh <= band_hi:
                px[x, y] = ((hh + delta) % 256, s, v)
    out = hsv.convert("RGB").convert("RGBA")
    out.putalpha(a)
    return out

def frame0(sheet, n_frames):
    fw = sheet.width // n_frames
    f = sheet.crop((0, 0, fw, sheet.height))
    return f.crop(f.getbbox())

def put_feet(canvas, sprite, x, feet_y, flip=False):
    s = sprite.crop(sprite.getbbox())
    if flip:
        s = s.transpose(Image.FLIP_LEFT_RIGHT)
    canvas.alpha_composite(s, (x, feet_y - s.height))

def badge(canvas):
    b = Image.open(os.path.join(REPO, "assets/logo-badge.png")).convert("RGBA")
    canvas.alpha_composite(b, (8, 8))

def new_canvas():
    return Image.new("RGBA", (W, H), (10, 10, 10, 255))

# ---------- SWAMP (levels 1-2) ----------
def swamp():
    # canvas base = the trees' own crown-backdrop plate color (30,32,30) so the
    # plates merge into one continuous canopy band like the artist's preview
    c = Image.new("RGBA", (W, H), (30, 32, 30, 255))
    bg = load("gothicvania_swamp_files/Gothicvania Swamp files/Evironment/background.png")
    tile_x(c, bg, H)
    mid2 = load("gothicvania_swamp_files/Gothicvania Swamp files/Evironment/mid-layer-02.png")
    mid1 = load("gothicvania_swamp_files/Gothicvania Swamp files/Evironment/mid-layer-01.png")
    tile_x(c, mid2, H)
    tile_x(c, mid1, H)
    trees = islands(load("gothicvania_swamp_files/Gothicvania Swamp files/Evironment/trees.png"))
    ts = islands(load("gothicvania_swamp_files/Gothicvania Swamp files/Evironment/tileset.png"))
    surface = ts[0]  # widest surface-with-fill block
    # canopy: big tree pasted twice so its crown closes the top of the frame
    # (only islands[0] — trees.png also contains an opaque backdrop plate island)
    if trees:
        put_feet(c, trees[0], -80, FLOOR_Y + 6, flip=True)
        put_feet(c, trees[0], 120, FLOOR_Y + 6)
        put_feet(c, trees[0], 420, FLOOR_Y + 6, flip=True)
    # terrain: tile surface block from FLOOR_Y down; bottom-fill with its lower half
    tile_x(c, surface, FLOOR_Y + surface.height)
    fill = surface.crop((0, surface.height - 16, surface.width, surface.height))
    yb = FLOOR_Y + surface.height
    while yb < H + 16:
        tile_x(c, fill, yb + 16)
        yb += 16
    # characters
    # SWAMP_*_FEET_Y: measured directly from the sourced tileset.png "surface"
    # island (ts[0], the 80x62 grass-topped dirt block tiled above as the
    # ground), not guessed. FLOOR_Y is that island's alpha-bbox top -- i.e. the
    # single highest grass-blade pixel across the whole 80px-wide repeating
    # tile -- not the actual visual grass line under any given character;
    # individual columns of the tile dip 0-6px below that peak as the grass
    # texture undulates. Sampling the tile's real alpha data at each ground
    # character's stance x (mod the 80px tile width, averaged across their
    # sprite's own footprint width) gives the true per-character visual
    # top-of-grass row: player footprint at x=150 averages 4px below FLOOR_Y,
    # spider at x=420 averages 2px below, thing at x=520 averages 1px below.
    # Anchoring every character's feet at FLOOR_Y directly (round-3 bug) put
    # them all at the tile's rare grass-blade peak instead, floating them
    # 1-4px above the ground they're meant to stand on -- most visible on the
    # player, caught by round-3 human sign-off ("gubben svavar lite ovanpa
    # marken" / "the guy is floating a bit above the ground"). FLOOR_Y itself
    # is unchanged: it still correctly anchors where the terrain tile geometry
    # is drawn (trees above and the ground tiling reuse it as-is); only the
    # characters standing on that ground needed a per-character offset.
    SWAMP_PLAYER_FEET_Y = FLOOR_Y + 4
    SWAMP_SPIDER_FEET_Y = FLOOR_Y + 2
    SWAMP_THING_FEET_Y = FLOOR_Y + 1
    player = load("gothicvania_swamp_files/Gothicvania Swamp files/Sprites/Player/idle/idle1.png")
    put_feet(c, player, 150, SWAMP_PLAYER_FEET_Y)
    spider = load("gothicvania_swamp_files/Gothicvania Swamp files/Sprites/Spider/walk/spider1.png")
    put_feet(c, spider, 420, SWAMP_SPIDER_FEET_Y, flip=True)
    thing = load("gothicvania_swamp_files/Gothicvania Swamp files/Sprites/Thing/walk thing/thing1.png")
    put_feet(c, thing, 520, SWAMP_THING_FEET_Y, flip=True)
    badge(c)
    return c

# ---------- TOWN (levels 3-4) ----------
def town():
    c = new_canvas()
    prev = load("gothicvania-town-files/GothicVania-town-files/PNG/environment/environment-preview.png")
    # no-pink pass: rotate the salmon/mauve dusk sky to steel-blue night
    # (matches the collection's own "Town at Night" concept)
    prev = hue_shift_band(prev, 215, 255, -60)
    crop = prev.crop((60, 0, 60 + W, prev.height))
    top = H - prev.height
    stretch_top(c, crop, top)
    c.alpha_composite(crop, (0, top))
    hero = load("gothicvania_swamp_files/Gothicvania Swamp files/Sprites/Player/idle/idle1.png")
    put_feet(c, hero, 300, 344)
    hound = frame0(load("gothicvaniapatreoncollection/ gothicvania patreon collection/Hell-Hound-Files/PNG/hell-hound-idle.png"), 6)
    put_feet(c, hound, 470, 344, flip=True)
    badge(c)
    return c

# ---------- CEMETERY (levels 5-6) ----------
def cemetery():
    c = new_canvas()
    bg = load("gothicvania-cemetery-files_1/gothicvania-cemetery-files/PNG/Environment/background.png")
    # no-pink pass: rotate the magenta glow toward cold blue
    bg = hue_shift_band(bg, 195, 245, -50)
    stretch_top(c, bg, H - bg.height)
    tile_x(c, bg, H)
    mts = load("gothicvania-cemetery-files_1/gothicvania-cemetery-files/PNG/Environment/mountains.png")
    mts = hue_shift_band(mts, 195, 245, -50)
    tile_x(c, mts, 330)
    ground = load("gothicvania-cemetery-files_1/gothicvania-cemetery-files/PNG/Environment/graveyard.png")
    tile_x(c, ground, H + 10)
    statue = load("gothicvania-cemetery-files_1/gothicvania-cemetery-files/PNG/Environment/sliced-objects/statue.png")
    put_feet(c, statue, 60, 330)
    stone = load("gothicvania-cemetery-files_1/gothicvania-cemetery-files/PNG/Environment/sliced-objects/stone-1.png")
    put_feet(c, stone, 400, 330)
    hero = load("gothicvania_swamp_files/Gothicvania Swamp files/Sprites/Player/idle/idle1.png")
    put_feet(c, hero, 220, 332)
    ghost = frame0(load("gothicvaniapatreoncollection/ gothicvania patreon collection/Ghost-Files/PNG/ghost-idle.png"), 7)
    c.alpha_composite(ghost, (480, 240))
    badge(c)
    return c

# ---------- CASTLE (levels 7-8) ----------
def castle():
    c = new_canvas()
    prev = load("gothicvaniapatreoncollection/ gothicvania patreon collection/Old-dark-Castle-tileset-Files/PNG/preview-old-dark-castle-interior-tileset.png")
    crop = prev.crop((250, 0, 250 + W, prev.height))
    top = H - prev.height
    stretch_top(c, crop, top)
    c.alpha_composite(crop, (0, top))
    hero = load("gothicvania_swamp_files/Gothicvania Swamp files/Sprites/Player/idle/idle1.png")
    # CASTLE_HERO_FEET_Y: measured directly from the sourced preview tileset, not
    # guessed. The floating door-ledge the hero stands on (crop columns ~150-260)
    # has its walkable top edge (gold trim -> void transition, sampled pixel-by-
    # -pixel) at crop-local y=234, i.e. canvas y = 234 + top(56) = 290. The prior
    # value (336) placed the hero's feet 46px below that edge, in the open void
    # under the floating ledge (confirmed void, not stone, by sampling: pixels
    # below the ledge at this x match the scene's background color, not a solid
    # block) — round 2 human sign-off caught this as "base varies" misalignment.
    # Unlike swamp (which tiles its own terrain from the shared FLOOR_Y=320 and
    # then applies a small per-character measured offset on top of it — see the
    # SWAMP_*_FEET_Y comment in swamp() above), town/cemetery/castle each
    # composite a pre-made background plate whose visual floor row is NOT at a
    # shared y — each needs its own measured feet_y entirely.
    put_feet(c, hero, 210, 290)
    hound = frame0(load("gothicvaniapatreoncollection/ gothicvania patreon collection/Hell-Hound-Files/PNG/hell-hound-idle.png"), 6)
    # CASTLE_HOUND_FEET_Y: measured directly from the sourced preview tileset,
    # not guessed (round-5 fix -- round-4 human sign-off: "the weird dog is
    # floating in the air on that ledge"). The prior code placed the hound
    # with a raw `c.alpha_composite(hound, (430, 230))` -- a bare top-left
    # paste that bypassed put_feet's feet-anchoring entirely, unlike every
    # other character in every other scene. The hound's footprint (canvas
    # x=430-467) sits over the rope bridge, NOT the door-ledge the player
    # stands on (that ledge ends around x=260 -- see CASTLE_HERO_FEET_Y
    # comment above). Sampling the bridge deck's gold-trim top edge pixel-by-
    # -pixel across the hound's full footprint width (x=430..467) gives a
    # consistent top row at crop-local y~202 (canvas y = 202 + top(56) = 258,
    # confirmed solid deck, not void, at every sampled column) -- not the same
    # y as the player's ledge, and not guessed as identical to it.
    CASTLE_HOUND_FEET_Y = 258
    put_feet(c, hound, 430, CASTLE_HOUND_FEET_Y)
    badge(c)
    return c

scenes = {"swamp": swamp, "town": town, "cemetery": cemetery, "castle": castle}
frames = {}
for name, fn in scenes.items():
    im = fn().convert("RGB")
    im.save(f"{OUT}/style-board-{name}.png", optimize=True)
    frames[name] = im
    print("built", name)

# contact sheet: 2x2 at 1.5x nearest (matches the game's CSS display scale)
sw, sh = int(W * 1.5), int(H * 1.5)
gap = 8
sheet = Image.new("RGB", (sw * 2 + gap * 3, sh * 2 + gap * 3), (20, 20, 20))
order = ["swamp", "town", "cemetery", "castle"]
for i, name in enumerate(order):
    big = frames[name].resize((sw, sh), Image.NEAREST)
    x = gap + (i % 2) * (sw + gap)
    y = gap + (i // 2) * (sh + gap)
    sheet.paste(big, (x, y))
sheet.save(f"{OUT}/style-board-sheet.png", optimize=True)
print("sheet done", sheet.size)
