#!/usr/bin/env python3
"""N0X logo candidates — v2, SNES-fidelity (BRAND-01).
Uppercase N0X, chiseled/dimensional (multi-tone bevel + rim light + drop shadow + outer glow),
rendered at a larger pixel grid than v1. Vendored monogram font; NEAREST upscale keeps pixels crisp.
Output: preview PNGs (dark title backing) + transparent heroes."""
import os, random
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops

random.seed(20260719)
ROOT = "/home/magnus/dev/nox-quiz"
OUT = os.path.dirname(os.path.abspath(__file__))
FONT = os.path.join(ROOT, "assets/_font-src/monogram.ttf")

BG=(0x0a,0x0a,0x0a); SURFACE=(20,20,20)
MOSS=(0x47,0x68,0x47); REWARD=(0x00,0xff,0x88); TEXT=(0xe8,0xe8,0xe8); DIM=(0x88,0x88,0x88)
RUST=(0x8c,0x50,0x36); EMBER=(0xa8,0x50,0x2c); STEEL=(0x52,0x5e,0x82); BORDER=(0x5e,0x5e,0x5e)

TXT="N0X"; FS=92; SCALE=4; BOLD=1

def lerp(a,b,t): return tuple(int(a[i]+(b[i]-a[i])*t) for i in range(3))
def shift(img,dx,dy): return ImageChops.offset(img,dx,dy)
def rim(mask,dx,dy): return ImageChops.subtract(mask, shift(mask,dx,dy))

def glyph_mask(txt, size=FS, bold=BOLD):
    font=ImageFont.truetype(FONT,size)
    bb=font.getbbox(txt); w,h=bb[2]-bb[0]+2*(bold+3), bb[3]-bb[1]+2*(bold+3)
    m=Image.new("L",(w,h),0)
    ImageDraw.Draw(m).text((bold+3-bb[0],bold+3-bb[1]),txt,font=font,fill=255)
    for _ in range(bold): m=m.filter(ImageFilter.MaxFilter(3))
    return m

def vgrad(size, top, bot):
    w,h=size; g=Image.new("RGB",(w,h)); px=g.load()
    for y in range(h):
        c=lerp(top,bot,y/max(1,h-1))
        for x in range(w): px[x,y]=c
    return g

def beveled(mask, body_top, body_bot, hi, lo, outline=(0,0,0), rim_px=2):
    W,H=mask.size; out=Image.new("RGBA",(W,H),(0,0,0,0))
    dil=mask
    for _ in range(rim_px): dil=dil.filter(ImageFilter.MaxFilter(3))
    o=Image.new("RGBA",(W,H),(0,0,0,0)); o.paste(outline+(255,),(0,0),dil); out.alpha_composite(o)
    grad=vgrad((W,H),body_top,body_bot).convert("RGBA"); grad.putalpha(mask); out.alpha_composite(grad)
    hi_edge=Image.new("L",(W,H),0); lo_edge=Image.new("L",(W,H),0)
    for d in range(1,rim_px+1):
        hi_edge=ImageChops.lighter(hi_edge, rim(mask,-d,-d))
        lo_edge=ImageChops.lighter(lo_edge, rim(mask, d, d))
    hl=Image.new("RGBA",(W,H),(0,0,0,0)); hl.paste(hi+(255,),(0,0),hi_edge); out.alpha_composite(hl)
    sh=Image.new("RGBA",(W,H),(0,0,0,0)); sh.paste(lo+(255,),(0,0),lo_edge); out.alpha_composite(sh)
    return out

def with_glow(mark, mask, glow_col, blur=4, grow=3, alpha=150):
    W,H=mark.size; g=mask
    for _ in range(grow): g=g.filter(ImageFilter.MaxFilter(3))
    gl=Image.new("RGBA",(W,H),(0,0,0,0)); gl.paste(glow_col+(alpha,),(0,0),g); gl=gl.filter(ImageFilter.GaussianBlur(blur))
    base=Image.new("RGBA",(W,H),(0,0,0,0)); base.alpha_composite(gl); base.alpha_composite(mark)
    return base

def drop_shadow(mark, dx=3, dy=4, blur=2, alpha=160):
    W,H=mark.size; pad=8; a=mark.split()[3]
    sh=Image.new("RGBA",(W+pad,H+pad),(0,0,0,0))
    tmp=Image.new("RGBA",(W,H),(0,0,0,0)); tmp.paste((0,0,0,alpha),(0,0),a); tmp=tmp.filter(ImageFilter.GaussianBlur(blur))
    sh.alpha_composite(tmp,(pad//2+dx,pad//2+dy)); sh.alpha_composite(mark,(pad//2,pad//2))
    return sh

def backing(W,H):
    im=Image.new("RGBA",(W,H),BG+(255,)); d=ImageDraw.Draw(im)
    for i in range(7): d.rectangle([i,i,W-1-i,H-1-i],outline=(0,0,0,10))
    px=im.load()
    for y in range(0,H,3):
        for x in range(W):
            r,g,b,a=px[x,y]; px[x,y]=(max(0,r-3),max(0,g-3),max(0,b-3),a)
    return im

def finish(mark, name):
    up=mark.resize((mark.width*SCALE,mark.height*SCALE),Image.NEAREST)
    W,H=760,240; bk=backing(W,H)
    bk.alpha_composite(up,((W-up.width)//2,(H-up.height)//2))
    bk.save(os.path.join(OUT,f"{name}.png"))
    up.save(os.path.join(OUT,f"{name}-hero-transparent.png"))
    print("wrote",name)

def a_emerald():
    m=glyph_mask(TXT)
    mark=beveled(m, lerp(MOSS,REWARD,.25),(0x22,0x38,0x28), REWARD,(0x0e,0x1c,0x14),(0,0,0),2)
    mark=with_glow(mark,m,REWARD,5,2,90); mark=drop_shadow(mark); finish(mark,"A-emerald-chisel")

def b_forged():
    m=glyph_mask(TXT)
    mark=beveled(m, EMBER,(0x3a,0x18,0x10),(0xff,0xb0,0x50),(0x1c,0x0a,0x06),(0,0,0),2)
    mark=with_glow(mark,m,(0xff,0x66,0x22),6,3,110); mark=drop_shadow(mark); finish(mark,"B-forged-ember")

def c_steel():
    m=glyph_mask(TXT)
    mark=beveled(m, lerp(STEEL,TEXT,.35),(0x22,0x2a,0x40),(0xff,0xff,0xff),(0x10,0x14,0x22),(0,0,0),2)
    px=mark.load()
    for y in range(mark.height):
        if y%2==0:
            for x in range(mark.width):
                r,g,b,a=px[x,y]
                if a>0: px[x,y]=(min(255,r+10),min(255,g+12),min(255,b+16),a)
    mark=drop_shadow(mark); finish(mark,"C-cold-steel")

def d_neon_core():
    font=ImageFont.truetype(FONT,FS); adv=int(font.getlength("0"))
    full=glyph_mask("N0X"); W2,H2=full.size
    zero=Image.new("L",(W2,H2),0); sides=Image.new("L",(W2,H2),0)
    pz=zero.load(); ps=sides.load(); pf=full.load()
    x0=int(adv*0.9); x1=int(adv*2.05)
    for y in range(H2):
        for x in range(W2):
            v=pf[x,y]
            if v==0: continue
            (pz if x0<=x<=x1 else ps)[x,y]=v
    side=beveled(sides,(0x3a,0x3d,0x3a),(0x12,0x14,0x12),(0x9a,0xa0,0x9a),(0,0,0),(0,0,0),2)
    zero_mark=beveled(zero, REWARD,(0x03,0x66,0x3a),(0xd8,0xff,0xf0),(0x02,0x40,0x28),(0x02,0x2a,0x1c),2)
    zero_mark=with_glow(zero_mark,zero,REWARD,7,4,170)
    out=Image.new("RGBA",(W2,H2),(0,0,0,0)); out.alpha_composite(side); out.alpha_composite(zero_mark)
    out=drop_shadow(out); finish(out,"D-neon-core")

def e_bone():
    m=glyph_mask(TXT)
    mark=beveled(m,(0xd6,0xd2,0xc4),(0x6a,0x6e,0x60),(0xff,0xff,0xf4),(0x2a,0x30,0x24),(0x14,0x18,0x12),3)
    mark=with_glow(mark,m,MOSS,5,2,70)
    px=mark.load()
    for y in range(mark.height):
        for x in range(mark.width):
            r,g,b,a=px[x,y]
            if a>0 and random.random()<0.06:
                f=0.7 if random.random()<0.5 else 1.18
                px[x,y]=(min(255,int(r*f)),min(255,int(g*f)),min(255,int(b*f)),a)
    mark=drop_shadow(mark); finish(mark,"E-bone-relief")

for fn in (a_emerald,b_forged,c_steel,d_neon_core,e_bone): fn()
print("\nAll N0X candidates in",OUT)
