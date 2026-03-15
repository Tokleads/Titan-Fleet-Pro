from PIL import Image, ImageDraw, ImageFont
from moviepy import ImageClip, concatenate_videoclips
import numpy as np

W, H = 1920, 1080
fps = 24
FONT_BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
FONT_REG = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'

BRAND_BLUE = (37, 99, 235)
BRAND_ACCENT = (59, 130, 246)
BRAND_GREEN = (34, 197, 94)
BRAND_RED = (239, 68, 68)
TEXT_MUTED = (148, 163, 184)
TEXT_LIGHT = (203, 213, 225)
WHITE = (255, 255, 255)

def gradient_bg():
    arr = np.zeros((H, W, 3), dtype=np.uint8)
    top, bot = (8, 15, 35), (15, 23, 42)
    for c in range(3):
        arr[:, :, c] = np.linspace(top[c], bot[c], H, dtype=np.uint8)[:, None]
    return Image.fromarray(arr)

def shadowed(draw, pos, text, font, fill=WHITE, offset=3):
    x, y = pos
    draw.text((x+offset, y+offset), text, font=font, fill=(0, 0, 0))
    draw.text((x, y), text, font=font, fill=fill)

def cx(draw, text, font):
    return (W - draw.textbbox((0,0), text, font=font)[2]) // 2

def wrap(draw, text, font, max_w):
    lines, cur = [], ""
    for w in text.split(' '):
        t = f"{cur} {w}".strip()
        if draw.textbbox((0,0), t, font=font)[2] > max_w:
            if cur: lines.append(cur)
            cur = w
        else:
            cur = t
    if cur: lines.append(cur)
    return lines

def slide_title():
    img = gradient_bg()
    d = ImageDraw.Draw(img)
    f96 = ImageFont.truetype(FONT_BOLD, 96)
    f32 = ImageFont.truetype(FONT_REG, 32)
    f28 = ImageFont.truetype(FONT_BOLD, 28)
    t = "TITAN FLEET"
    shadowed(d, (cx(d,t,f96), H//2-120), t, f96, offset=4)
    s = "UK Fleet Management Software"
    d.text((cx(d,s,f32), H//2+10), s, font=f32, fill=TEXT_MUTED)
    d.line([(W//2-80,H//2+65),(W//2+80,H//2+65)], fill=BRAND_ACCENT, width=2)
    tag = "DVSA Compliance  |  GPS Tracking  |  AI Defect Triage  |  Timesheets"
    d.text((cx(d,tag,f28), H//2+90), tag, font=f28, fill=BRAND_ACCENT)
    return img

def slide_problem():
    img = gradient_bg()
    d = ImageDraw.Draw(img)
    f56 = ImageFont.truetype(FONT_BOLD, 56)
    f80 = ImageFont.truetype(FONT_BOLD, 80)
    f22 = ImageFont.truetype(FONT_REG, 22)
    f30 = ImageFont.truetype(FONT_REG, 30)
    t = "STILL USING PAPER CHECKS?"
    shadowed(d, (cx(d,t,f56), 140), t, f56, offset=3)
    d.line([(W//2-60,225),(W//2+60,225)], fill=BRAND_RED, width=3)
    stats = [("43%","of DVSA prohibitions from\nwalkaround check failures"),
             ("\u00a31,500","average cost per\nroadside prohibition"),
             ("87%","of operators fail first\nearned recognition audit")]
    gap = W // 4
    for i,(num,label) in enumerate(stats):
        c = gap*(i+1)
        nw = d.textbbox((0,0),num,font=f80)[2]
        shadowed(d,(c-nw//2,H//2-80),num,f80,fill=BRAND_RED,offset=3)
        for j,line in enumerate(label.split('\n')):
            lw = d.textbbox((0,0),line,font=f22)[2]
            d.text((c-lw//2,H//2+30+j*30),line,font=f22,fill=TEXT_MUTED)
    b = "Titan Fleet eliminates these risks with digital-first compliance"
    d.text((cx(d,b,f30),H-200),b,font=f30,fill=BRAND_ACCENT)
    return img

def slide_feature(sc_path, headline, subtext, stat=None):
    img = gradient_bg()
    sc = Image.open(sc_path).convert('RGB').resize((1280,720),Image.LANCZOS)
    sc_x, sc_y = W-1280-50, (H-720)//2
    shadow = Image.new('RGB',(1290,730),(5,10,25))
    img.paste(shadow,(sc_x+5,sc_y+5))
    border = Image.new('RGB',(1284,724),BRAND_ACCENT)
    img.paste(border,(sc_x-2,sc_y-2))
    img.paste(sc,(sc_x,sc_y))
    d = ImageDraw.Draw(img)
    tw = sc_x - 80
    f48 = ImageFont.truetype(FONT_BOLD, 48)
    f21 = ImageFont.truetype(FONT_REG, 21)
    f64 = ImageFont.truetype(FONT_BOLD, 64)
    lines = wrap(d, headline, f48, tw)
    hy = H//2 - 100
    for i,l in enumerate(lines):
        shadowed(d,(50,hy+i*58),l,f48,offset=3)
    sy = hy+len(lines)*58+15
    d.line([(50,sy),(110,sy)],fill=BRAND_ACCENT,width=3)
    sl = wrap(d,subtext,f21,tw)
    for i,l in enumerate(sl):
        d.text((50,sy+18+i*28),l,font=f21,fill=TEXT_MUTED)
    if stat:
        sty = sy+18+len(sl)*28+25
        shadowed(d,(50,sty),stat,f64,fill=BRAND_GREEN,offset=3)
    return img

def slide_cta():
    img = gradient_bg()
    d = ImageDraw.Draw(img)
    f52 = ImageFont.truetype(FONT_BOLD, 52)
    f120 = ImageFont.truetype(FONT_BOLD, 120)
    f40 = ImageFont.truetype(FONT_REG, 40)
    f28 = ImageFont.truetype(FONT_BOLD, 28)
    f26 = ImageFont.truetype(FONT_REG, 26)
    f36 = ImageFont.truetype(FONT_BOLD, 36)
    f22 = ImageFont.truetype(FONT_REG, 22)
    t = "READY TO TAKE CONTROL?"
    shadowed(d,(cx(d,t,f52),120),t,f52,offset=3)
    d.line([(W//2-60,200),(W//2+60,200)],fill=BRAND_ACCENT,width=3)
    p = "\u00a359"
    shadowed(d,(cx(d,p,f120),H//2-140),p,f120,offset=4)
    per = "/month per vehicle"
    d.text((cx(d,per,f40),H//2+10),per,font=f40,fill=TEXT_MUTED)
    no = "NO SETUP FEES  |  NO CONTRACTS  |  CANCEL ANYTIME"
    d.text((cx(d,no,f28),H//2+70),no,font=f28,fill=BRAND_GREEN)
    feats = ["DVSA-Aligned Walkaround Checks","Live GPS Tracking & Geofencing",
             "AI-Powered Defect Triage","Predictive Fleet Analytics",
             "Driver Timesheets & Wage Calc","Fuel Intelligence & Cost Savings"]
    fy=H//2+140
    for i,f in enumerate(feats):
        txt = f"\u2713  {f}"
        d.text((cx(d,txt,f26), fy+i*36), txt, font=f26, fill=TEXT_LIGHT)
    bw,bh=420,65; bx=(W-bw)//2; by=H-150
    d.rounded_rectangle((bx,by,bx+bw,by+bh),radius=12,fill=BRAND_BLUE)
    cta="START FREE TRIAL"
    d.text((cx(d,cta,f36),by+12),cta,font=f36,fill=WHITE)
    url="titanfleet.co.uk"
    d.text((cx(d,url,f22),H-60),url,font=f22,fill=(100,116,139))
    return img

print("Creating slides...")
slide_title().save('assets/s0.png'); print("  Title")
slide_problem().save('assets/s1.png'); print("  Problem")

feats = [
    ("assets/dashboard.png","COMMAND CENTRE DASHBOARD","Real-time fleet overview with compliance scoring, live driver locations, MOT alerts, and attention-required items.",None),
    ("assets/inspections.png","DVSA-ALIGNED WALKAROUND CHECKS","Digital vehicle inspections drivers complete on their phone. Fully DVSA compliant with exportable PDF reports.",None),
    ("assets/defects.png","AI-POWERED DEFECT MANAGEMENT","Defects auto-triaged by AI using DVSA Guide to Roadworthiness. Kanban workflow from reported to resolved.",None),
    ("assets/tracking.png","LIVE GPS TRACKING","Real-time driver locations, stagnation alerts, geofencing, and shift trail maps with stop detection.",None),
    ("assets/fleet.png","FLEET & MOT MANAGEMENT","Live DVSA MOT data, automated expiry alerts, bulk upload. Your entire fleet managed in one place.","49 Vehicles"),
    ("assets/predictive.png","PREDICTIVE ANALYTICS","AI fleet health scoring, compliance forecasting, maintenance risk prediction, and 30-day cost projections.","76/100"),
]
for i,(sc,h,s,st) in enumerate(feats):
    slide_feature(sc,h,s,st).save(f'assets/s{i+2}.png'); print(f"  Feature {i}: {h}")

slide_cta().save('assets/s8.png'); print("  CTA")

print("\nAssembling video (static frames, fast render)...")

seq = [('assets/s0.png',4),('assets/s1.png',5),
       ('assets/s2.png',4),('assets/s3.png',4),('assets/s4.png',4),
       ('assets/s5.png',4),('assets/s6.png',4),('assets/s7.png',4),
       ('assets/s8.png',5)]

clips = [ImageClip(p).with_duration(d).with_fps(fps) for p,d in seq]
final = concatenate_videoclips(clips, method="compose")
final.write_videofile("titan_fleet_ad.mp4", fps=fps, bitrate="8000k",
                      preset="ultrafast", threads=4)

total = sum(d for _,d in seq)
print(f"\nDone! titan_fleet_ad.mp4 ({total}s, {W}x{H})")
