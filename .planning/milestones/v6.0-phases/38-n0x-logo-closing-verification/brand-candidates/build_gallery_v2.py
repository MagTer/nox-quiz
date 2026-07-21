#!/usr/bin/env python3
import base64, os
D = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(D, "n0x-candidates.html")

def datauri(fn):
    with open(os.path.join(D, fn), "rb") as f:
        return "data:image/png;base64," + base64.b64encode(f.read()).decode()

CARDS = [
    ("A", "Emerald Chisel", "A-emerald-chisel.png", "moss → neon, beveled + glow",
     "The refinement of the Heritage direction you liked — same moss/neon-green identity, now chiseled with a bright rim-light and an outer glow. The safe, strong evolution.",
     "#00ff88", True),
    ("B", "Forged Ember", "B-forged-ember.png", "molten rust → ember, forge glow",
     "N0X struck from hot metal — rust body, amber highlights, a forge glow bleeding off the edges. Pulls the mark into the late-game castle heat.",
     "#ff6622", False),
    ("C", "Cold Steel", "C-cold-steel.png", "brushed steel-blue, white specular",
     "Colder and machined — brushed steel-blue with a hard white specular and a faint scanline sheen. The most 'arcade cabinet' read.",
     "#8fa0d8", False),
    ("D", "Neon Core", "D-neon-core.png", "dark chrome N·X, glowing 0",
     "The one real idea, now dimensional: N and X are dark chrome, the 0 is a glowing neon-green core. Makes the zero itself the memorable brand mark.",
     "#00ff88", True),
    ("E", "Bone Relief", "E-bone-relief.png", "carved bone/stone, moss undertone",
     "N0X carved from weathered bone-stone with a deep bevel and a moss undertone in the grooves — a grunge monument. Color-neutral so the biome art carries the palette.",
     "#c8c4b4", False),
]

cards_html = "\n".join(f'''
      <article class="card{' lead' if lead else ''}" style="--pick:{accent}">
        <div class="shot"><img src="{datauri(fn)}" alt="N0X candidate: {name}" /></div>
        <div class="meta">
          <div class="chip"><span class="num">{letter}</span><h2>{name}</h2>{'<span class="tag">recommended</span>' if lead else ''}</div>
          <p class="spec">{spec}</p>
          <p class="note">{note}</p>
        </div>
      </article>''' for (letter, name, fn, spec, note, accent, lead) in CARDS)

HTML = f'''<title>N0X — logo candidates (v2)</title>
<style>
  :root {{
    --bg:#0a0a0a; --surface:#141414; --surface-2:#191919; --border:#2a2c28; --border-lit:#3a4a38;
    --text:#e8e8e8; --dim:#8a8f86; --moss:#476847; --neon:#00ff88; --maxw:1080px;
  }}
  * {{ box-sizing:border-box; }}
  html {{ -webkit-text-size-adjust:100%; }}
  body {{
    margin:0; background:var(--bg); color:var(--text);
    font:15px/1.55 ui-monospace,"SF Mono","Cascadia Mono",Menlo,Consolas,monospace;
    background-image:repeating-linear-gradient(180deg, rgba(255,255,255,.014) 0 1px, transparent 1px 3px);
  }}
  .wrap {{ max-width:var(--maxw); margin:0 auto; padding:clamp(24px,5vw,56px) clamp(16px,4vw,32px) 72px; }}
  header {{ border-bottom:1px solid var(--border); padding-bottom:22px; margin-bottom:30px; }}
  .eyebrow {{ color:var(--neon); letter-spacing:.32em; text-transform:uppercase; font-size:11px; margin:0 0 12px; }}
  h1 {{ font-size:clamp(26px,5vw,40px); line-height:1.05; margin:0 0 12px; letter-spacing:-.01em; text-wrap:balance; }}
  h1 b {{ color:var(--neon); font-weight:inherit; }}
  .lede {{ color:var(--dim); max-width:68ch; margin:0; }}
  .lede b {{ color:var(--text); font-weight:600; }}
  .grid {{ display:grid; grid-template-columns:repeat(2,1fr); gap:18px; }}
  @media (max-width:720px) {{ .grid {{ grid-template-columns:1fr; }} }}
  .card {{
    background:var(--surface); border:1px solid var(--border); border-radius:4px; overflow:hidden;
    display:flex; flex-direction:column; transition:border-color .18s ease, transform .18s ease;
  }}
  .card.lead {{ border-color:var(--border-lit); }}
  .card:hover {{ border-color:var(--pick); transform:translateY(-2px); }}
  .shot {{ background:#000; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:center; padding:6px; }}
  .shot img {{ display:block; width:100%; height:auto; image-rendering:pixelated; }}
  .meta {{ padding:16px 18px 20px; display:flex; flex-direction:column; gap:9px; }}
  .chip {{ display:flex; align-items:baseline; gap:10px; flex-wrap:wrap; }}
  .num {{ font-size:12px; color:var(--bg); background:var(--pick); font-weight:700; padding:2px 8px; border-radius:3px; }}
  .chip h2 {{ font-size:18px; margin:0; }}
  .tag {{ margin-left:auto; font-size:10.5px; letter-spacing:.14em; text-transform:uppercase; color:var(--pick); border:1px solid var(--pick); border-radius:99px; padding:2px 9px; }}
  .spec {{ margin:0; color:var(--pick); font-size:12.5px; letter-spacing:.02em; }}
  .note {{ margin:0; color:var(--dim); font-size:13.5px; }}
  footer {{ margin-top:34px; border-top:1px solid var(--border); padding-top:20px; color:var(--dim); font-size:13.5px; }}
  footer b {{ color:var(--text); }}
  .how {{ margin-top:10px; }} .how kbd {{ font:inherit; background:var(--surface-2); border:1px solid var(--border-lit); color:var(--neon); border-radius:3px; padding:1px 6px; }}
</style>

<div class="wrap">
  <header>
    <p class="eyebrow">Nox Run · BRAND-01 · v2 · SNES-fidelity</p>
    <h1>The <b>N0X</b> mark — five chiseled directions</h1>
    <p class="lede">Now <b>uppercase N0X</b>, rendered at a higher pixel grid with real dimension — multi-tone bevels, rim-light, drop shadow and glow — to sit at SNES fidelity next to the redressed world. <b>A · Emerald Chisel</b> is the evolution of the Heritage look you liked; the rest push somewhere else. These are direction previews — the winner gets baked into the final title hero + select badge and goes through your sign-off.</p>
  </header>

  <div class="grid">{cards_html}
  </div>

  <footer>
    <b>Tell me the letter</b> — or blend (e.g. “<b>A</b>'s emerald, but <b>D</b>'s glowing-0”). I'll bake the winner to the real <kbd>logo-hero</kbd> (360×90) + <kbd>logo-badge</kbd> (144×36) and wire it into the title + select screens.
    <div class="how">My picks: <kbd>A Emerald Chisel</kbd> (safe, strong) · <kbd>D Neon Core</kbd> (most distinctive)</div>
  </footer>
</div>
'''
with open(OUT, "w") as f: f.write(HTML)
print("wrote", OUT, os.path.getsize(OUT), "bytes")
