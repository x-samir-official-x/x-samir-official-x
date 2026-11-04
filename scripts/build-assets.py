"""Generates the gold SVG card system used by README.md.

Run: python3 scripts/build-assets.py   (writes into assets/)
"""
from pathlib import Path
from xml.sax.saxutils import escape as esc

OUT = Path(__file__).resolve().parent.parent / "assets"
OUT.mkdir(exist_ok=True)

MID, DARK, SURF, DEEP = "#0B0906", "#14100A", "#1F180D", "#3D2E14"
ACC, GOLD, PALE, IVORY, MUTED = "#8A6A2B", "#D4AF63", "#EBD6A3", "#FBF7EE", "#B8AA8F"
SERIF = "Georgia, 'Times New Roman', serif"
MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
SANS = "-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"
AR = "Tahoma, 'Segoe UI', Arial, sans-serif"
W = 1200

BASE_CSS = """
.fi{animation:fi .9s ease-out both}
.su{animation:su .9s cubic-bezier(.2,.7,.2,1) both}
@keyframes fi{from{opacity:0}to{opacity:1}}
@keyframes su{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion: reduce){.fi,.su,.ty{animation:none!important}}
"""


def svg(name, h, body, label, extra_css="", p="x"):
    defs = f"""<defs>
  <linearGradient id="{p}-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{DARK}"/><stop offset="1" stop-color="{MID}"/></linearGradient>
  <radialGradient id="{p}-glow" cx="0.18" cy="0.1" r="0.8"><stop offset="0" stop-color="{ACC}" stop-opacity="0.38"/><stop offset="0.55" stop-color="{DEEP}" stop-opacity="0.12"/><stop offset="1" stop-color="{DEEP}" stop-opacity="0"/></radialGradient>
  <linearGradient id="{p}-line" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="{GOLD}" stop-opacity="0"/><stop offset="0.5" stop-color="{PALE}"/><stop offset="1" stop-color="{GOLD}" stop-opacity="0"/></linearGradient>
  <pattern id="{p}-grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="{DEEP}" stroke-width="0.5" opacity="0.45"/></pattern>
  <filter id="{p}-blur" x="-20%" y="-300%" width="140%" height="700%"><feGaussianBlur stdDeviation="3"/></filter>
</defs>"""
    doc = f"""<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{h}" viewBox="0 0 {W} {h}" role="img" aria-label="{esc(label)}">
<title>{esc(label)}</title>
<style>{BASE_CSS}{extra_css}</style>
{defs}
{body}
</svg>
"""
    (OUT / name).write_text(doc, encoding="utf-8")


def card(p, x, y, w, h, rx=18, grid=True):
    g = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="url(#{p}-grid)" opacity="0.6"/>' if grid else ""
    return (f'<rect x="{x+.5}" y="{y+.5}" width="{w-1}" height="{h-1}" rx="{rx}" fill="url(#{p}-bg)" stroke="{DEEP}"/>'
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="url(#{p}-glow)"/>{g}'
            f'<rect x="{x+28}" y="{y}" width="160" height="1.5" fill="{PALE}" opacity="0.75"/>')


def t(x, y, s, size=14, fill=IVORY, font=MONO, extra=""):
    return f'<text x="{x}" y="{y}" font-family="{font}" font-size="{size}" fill="{fill}" {extra}>{esc(s)}</text>'


def eyebrow(x, y, s, fill=GOLD, anchor="start"):
    return t(x, y, s.upper(), 11, fill, MONO, f'letter-spacing="3.2" text-anchor="{anchor}"')


# ---------------------------------------------------------------- hero
def hero():
    p = "hr"
    orbit_labels = [("UI", 915, 92), ("API", 1110, 128), ("AI", 1122, 300), ("RTL", 880, 330)]
    labels = "".join(
        f'<circle cx="{x-10}" cy="{y-4}" r="3" fill="{GOLD}"/>{t(x, y, l, 10, GOLD, MONO, "letter-spacing=\"2\"")}'
        for l, x, y in orbit_labels)
    body = f"""
{card(p, 10, 10, 1180, 420, 22)}
<g class="fi" style="animation-delay:.1s">
  <rect x="64" y="52" width="268" height="30" rx="15" fill="{MID}" stroke="{DEEP}"/>
  <circle cx="82" cy="67" r="4" fill="{ACC}"/>
  {t(94, 72, "~/samir $", 12, MUTED)}{t(166, 72, "build --arabic-first", 12, IVORY)}
  <rect x="320" y="60" width="7" height="14" fill="{PALE}"><animate attributeName="opacity" values="1;0;1" dur="1.1s" repeatCount="indefinite"/></rect>
</g>
<g class="su" style="animation-delay:.25s">
  <rect x="64" y="113" width="26" height="1.2" fill="{GOLD}"/>
  {eyebrow(100, 118, "Full-stack · AI products · RTL-first")}
</g>
<g class="su" style="animation-delay:.4s">
  {t(62, 196, "Samir", 76, IVORY, SERIF)}
  <text x="62" y="268" font-family="{SERIF}" font-size="76" font-style="italic" fill="{PALE}">Sayed<tspan fill="{GOLD}" font-style="normal">.</tspan></text>
</g>
<rect x="64" y="292" width="420" height="3" fill="url(#{p}-line)" filter="url(#{p}-blur)"><animate attributeName="opacity" values=".4;1;.4" dur="4s" repeatCount="indefinite"/></rect>
<rect x="64" y="293" width="420" height="1" fill="url(#{p}-line)"/>
<g class="su" style="animation-delay:.6s">
  {t(64, 326, "FULL-STACK ENGINEER  ·  AI PRODUCT BUILDER  ·  RTL-FIRST INTERFACES", 12, IVORY, MONO, 'letter-spacing="2.4" font-weight="700"')}
  {t(64, 354, "Building products for real people — Arabic first.", 16, MUTED, SERIF, 'font-style="italic"')}
</g>
<line x1="64" y1="382" x2="1136" y2="382" stroke="{DEEP}"/>
{eyebrow(64, 404, "Faculty of Commerce · Suez Canal University", MUTED)}
{eyebrow(1136, 404, "Ismailia · Egypt · عربي / English", MUTED, "end")}

<g fill="none" stroke="{GOLD}">
  <circle cx="1000" cy="208" r="150" opacity="0.18"/>
  <circle cx="1000" cy="208" r="118" opacity="0.14" stroke-dasharray="2 6">
    <animateTransform attributeName="transform" type="rotate" values="0 1000 208;360 1000 208" dur="80s" repeatCount="indefinite"/>
  </circle>
  <path d="M500 250 C650 250 760 200 852 170" opacity="0.35" stroke-width="1"/>
</g>
<circle r="3" fill="{PALE}"><animateMotion dur="14s" repeatCount="indefinite" path="M1150 208 A150 150 0 1 1 850 208 A150 150 0 1 1 1150 208"/></circle>
{labels}
<g class="fi" style="animation-delay:.5s">
  <path d="M928 330 V196 A72 72 0 0 1 1072 196 V330 Z" fill="{MID}" stroke="{ACC}" stroke-width="1.2"/>
  <path d="M928 330 V196 A72 72 0 0 1 1072 196 V330 Z" fill="url(#{p}-glow)"/>
  <text x="1000" y="268" text-anchor="middle" font-family="{SERIF}" font-size="104" font-style="italic" fill="{PALE}">S</text>
  <text x="1000" y="312" text-anchor="middle" font-family="{AR}" font-size="22" fill="{GOLD}" direction="rtl">سمير</text>
  <path d="M916 342 H948 M1052 342 H1084" stroke="{GOLD}" stroke-width="1"/>
</g>
"""
    svg("hero.svg", 440, body, "Samir Sayed — Full-Stack Engineer, AI Product Builder, RTL-first interfaces. Ismailia, Egypt.", p=p)


# ---------------------------------------------------------------- section titles
def title(name, num, label, plain, italic, right):
    p = "tt"
    body = f"""
{eyebrow(40, 34, f"{num}  {label}")}
{eyebrow(1160, 34, right, MUTED, "end")}
<text x="38" y="84" font-family="{SERIF}" font-size="36" fill="{IVORY}" class="su">{esc(plain)} <tspan fill="{PALE}" font-style="italic">{esc(italic)}</tspan></text>
<rect x="40" y="104" width="1120" height="1" fill="url(#{p}-line)" opacity="0.7"/>
<circle cx="600" cy="104" r="3" fill="{PALE}"><animate attributeName="cx" values="120;1080;120" dur="12s" repeatCount="indefinite"/></circle>
"""
    svg(name, 122, body, f"{num} {label} — {plain} {italic}", p=p)


# ---------------------------------------------------------------- about
def about():
    p = "ab"
    lines = [
        ("$", "whoami"),
        ("→", "Samir Sayed · Full-Stack Engineer · AI Product Builder"),
        ("$", "cat stack.txt"),
        ("→", "React · TypeScript · Node/Express · Supabase · Gemini API"),
        ("$", "cat focus.txt"),
        ("→", "Arabic-first, RTL-native products for the Egyptian market"),
        ("$", "ls ./shipped"),
        ("→", "aqar-go   athar-portal   safe-space   env-friends"),
    ]
    rows = ""
    for i, (pre, s) in enumerate(lines):
        y = 122 + i * 26
        col = PALE if pre == "$" else MUTED
        rows += (f'<g class="fi" style="animation-delay:{0.3 + i*0.35:.2f}s">'
                 f'{t(78, y, pre, 13, GOLD)}{t(100, y, s, 13, IVORY if pre == "$" else col)}</g>')
    caret_y = 122 + len(lines) * 26
    rows += f'{t(78, caret_y, "$", 13, GOLD)}<rect x="100" y="{caret_y-12}" width="8" height="15" fill="{PALE}"><animate attributeName="opacity" values="1;0;1" dur="1.1s" repeatCount="indefinite"/></rect>'
    specs = [
        ("Primary language", "TypeScript", "React · Vite · Express"),
        ("Where AI lives", "Gemini API", "assistants · OCR · documents"),
        ("Drawn to", "RTL-first UX", "Arabic products · real users"),
    ]
    spec = ""
    for i, (a, b, c) in enumerate(specs):
        y = 50 + i * 104
        spec += f"""<g class="su" style="animation-delay:{0.5 + i*0.2:.1f}s">
<rect x="800.5" y="{y+.5}" width="349" height="88" rx="12" fill="{MID}" stroke="{DEEP}"/>
<rect x="800" y="{y}" width="3" height="88" rx="1.5" fill="{GOLD}"/>
{eyebrow(824, y+26, a)}
{t(824, y+56, b, 25, IVORY, SERIF)}
{t(824, y+76, c, 12, MUTED, SANS)}</g>"""
    body = f"""
{card(p, 10, 10, 1180, 360, 20)}
<rect x="40.5" y="40.5" width="729" height="300" rx="12" fill="{MID}" stroke="{DEEP}"/>
<line x1="40" y1="76" x2="770" y2="76" stroke="{DEEP}"/>
<circle cx="62" cy="58" r="5" fill="{DEEP}"/><circle cx="80" cy="58" r="5" fill="{DEEP}"/><circle cx="98" cy="58" r="5" fill="{ACC}"/>
{t(405, 62, "samir@egypt: ~", 11, MUTED, MONO, 'text-anchor="middle" letter-spacing="1"')}
{rows}
{spec}
"""
    svg("about.svg", 380, body, "About Samir: Full-stack engineer and AI product builder. Stack: React, TypeScript, Node/Express, Supabase, Gemini API. Focus: Arabic-first, RTL-native products for the Egyptian market. Shipped Aqar-Go, Athar portal, Safe Space, Environment Friends.", p=p)


# ---------------------------------------------------------------- project cards
def flow(nodes, edges, caption, top_label):
    """nodes: list of (key, label, x, y, w); edges: list of (a, b)."""
    pos = {k: (x, y, w) for k, _, x, y, w in nodes}
    out = eyebrow(800, 70, top_label, MUTED)
    for i, (a, b) in enumerate(edges):
        ax, ay, aw = pos[a]; bx, by, bw = pos[b]
        x1, y1, x2, y2 = ax + aw, ay + 18, bx, by + 18
        mx = (x1 + x2) / 2
        d = f"M{x1} {y1} C{mx} {y1} {mx} {y2} {x2} {y2}"
        out += f'<path d="{d}" fill="none" stroke="{GOLD}" stroke-width="1.2" opacity="0.6"/>'
        out += f'<circle r="3" fill="{PALE}"><animateMotion dur="3.2s" begin="0s" repeatCount="indefinite" path="{d}"/></circle>'
    for k, label, x, y, w in nodes:
        out += (f'<rect x="{x}" y="{y}" width="{w}" height="36" rx="18" fill="{MID}" stroke="{ACC}"/>'
                f'<text x="{x + w/2}" y="{y+23}" text-anchor="middle" font-family="{MONO}" font-size="12" fill="{IVORY}">{esc(label)}</text>')
    out += eyebrow(800, 288, caption, MUTED)
    return out


def project(name, num_tag, title_txt, sub, built, facts, tags, diagram, label, title_ar=None):
    p = "pj"
    fx = ""
    for i, (big, small) in enumerate(facts):
        x = 52 + i * 228
        fx += f'<g class="su" style="animation-delay:{0.4 + i*0.15:.2f}s">{t(x, 228, big, 26, IVORY, SERIF)}{t(x, 250, small, 12, MUTED, SANS)}</g>'
    tg, x = "", 52
    for s in tags:
        w = 16 + len(s) * 7.4
        tg += f'<rect x="{x}" y="270" width="{w:.0f}" height="24" rx="12" fill="{MID}" stroke="{DEEP}"/>{t(x+8, 286, s, 11, PALE)}'
        x += w + 8
    ar = (f'<tspan font-family="{AR}" font-size="24" fill="{GOLD}" dx="16">{esc(title_ar)}</tspan>' if title_ar else "")
    body = f"""
{card(p, 10, 10, 1180, 310, 20)}
{eyebrow(52, 56, num_tag)}
<text x="50" y="118" font-family="{SERIF}" font-size="40" fill="{IVORY}" class="su">{esc(title_txt)}{ar}</text>
{t(52, 150, sub, 15, MUTED, SANS)}
<text x="52" y="176" font-family="{MONO}" font-size="12" fill="{GOLD}">BUILT › <tspan fill="{IVORY}">{esc(built)}</tspan></text>
<line x1="52" y1="194" x2="730" y2="194" stroke="{DEEP}"/>
{fx}
{tg}
{diagram}
"""
    svg(name, 330, body, label, p=p)


def projects():
    project("project-aqar-go.svg", "01 · PropTech · AI · Egypt", "Aqar-Go", "AI-powered real-estate platform for buyers, sellers and financing banks.",
            "one journey from search to financing, in Arabic", [("3 sides", "buyers · sellers · banks"), ("Gemini", "AI property assistant"), ("RTL", "Arabic-first interface")],
            ["React", "TypeScript", "Vite", "Express", "Gemini API", "Recharts"],
            flow([("b", "buyer", 800, 108, 100), ("ai", "ai match", 950, 108, 110), ("s", "seller", 1090, 80, 80), ("k", "bank", 1090, 150, 80)],
                 [("b", "ai"), ("ai", "s"), ("ai", "k")], "search · compare · finance", "proptech flow"),
            "Aqar-Go: AI-powered PropTech platform connecting buyers, sellers and financing banks in Egypt. React, TypeScript, Vite, Express, Gemini API.", "عقار جو")
    project("project-athar.svg", "02 · University · Docs · OCR", "Athar Portal", "Student activity portal for the Faculty of Commerce, Suez Canal University.",
            "submission → staff review → Arabic PDF form → marks", [("40", "activity marks after approval"), ("AR + EN", "certificate OCR"), ("PDF", "official Arabic forms")],
            ["React", "TypeScript", "Express", "Tesseract.js", "Zod", "Helmet"],
            flow([("s", "submit", 800, 108, 96), ("r", "review", 930, 108, 96), ("ok", "approved", 1060, 80, 100), ("pdf", "arabic pdf", 1060, 150, 100)],
                 [("s", "r"), ("r", "ok"), ("r", "pdf")], "demo build · sample data", "activity lifecycle"),
            "Athar: student activity portal for the Faculty of Commerce, Suez Canal University — submission, staff review, Arabic PDF forms and 40 activity marks after approval. Demo build. React, TypeScript, Express, Tesseract OCR.", "أَثَر")
    project("project-safe-space.svg", "03 · Wellbeing · AI · Egypt", "Safe Space", "A calm, stigma-free mental-wellbeing space for young adults in Egypt.",
            "mood tracking + a compassionate AI companion", [("Mood", "daily tracking + charts"), ("AI", "'Safe Friend' companion"), ("Private", "stigma-free by design")],
            ["React", "TypeScript", "Gemini API", "Recharts", "Tailwind"],
            flow([("m", "mood", 800, 108, 90), ("f", "safe friend", 925, 108, 130), ("i", "insights", 1080, 80, 90), ("h", "support", 1080, 150, 90)],
                 [("m", "f"), ("f", "i"), ("f", "h")], "check in · talk · reflect", "support loop"),
            "Safe Space: mental-wellbeing platform for young adults in Egypt with mood tracking and a compassionate AI companion. React, TypeScript, Gemini API, Recharts.")
    project("project-env-friends.svg", "04 · Student team · Web", "Environment Friends", "Official site of the faculty's environment team at Suez Canal University.",
            "content-driven site, zero build step", [("1 file", "config.js drives content"), ("0 build", "static, instant deploy"), ("AR", "Arabic, RTL layout")],
            ["HTML", "CSS", "JavaScript", "GitHub Pages"],
            flow([("c", "config.js", 800, 108, 110), ("r", "render", 945, 108, 96), ("w", "pages", 1076, 108, 90)],
                 [("c", "r"), ("r", "w")], "edit · push · live", "publishing flow"),
            "Environment Friends: official site of the faculty's environment team at Suez Canal University, content-driven from one config file. HTML, CSS, JavaScript, GitHub Pages.", "أصدقاء البيئة")


# ---------------------------------------------------------------- toolkit
def toolkit():
    p = "tk"
    cells = [
        ("01 Languages", [("TypeScript", 30, IVORY, "PRIMARY"), ("JavaScript", 24, IVORY, ""), ("HTML · CSS", 19, MUTED, "")], ""),
        ("02 AI · Documents", [("Gemini API", 28, IVORY, ""), ("Tesseract OCR", 22, IVORY, ""), ("Arabic PDF generation", 18, MUTED, "")], "arabic + english"),
        ("03 Frontend", [("React", 30, IVORY, ""), ("Vite · Tailwind", 22, IVORY, ""), ("Radix · TanStack · Motion", 18, MUTED, "")], ""),
        ("04 Backend · Data", [("Node.js · Express", 26, IVORY, ""), ("Supabase", 22, IVORY, ""), ("Zod · Helmet · Nodemailer", 18, MUTED, "")], ""),
        ("05 Ship", [("Vercel · Cloudflare", 26, IVORY, ""), ("GitHub Pages", 22, IVORY, ""), ("Git · GitHub", 18, MUTED, "")], ""),
        ("06 Craft", [("RTL-first UX", 28, IVORY, ""), ("Arabic typography", 22, IVORY, ""), ("Product thinking", 18, MUTED, "")], "egyptian market"),
    ]
    out = card(p, 10, 10, 1180, 400, 20)
    for i, (head, items, foot) in enumerate(cells):
        col, row = i % 3, i // 3
        x, y = 36 + col * 380, 36 + row * 184
        out += f'<g class="su" style="animation-delay:{0.2 + i*0.12:.2f}s"><rect x="{x+.5}" y="{y+.5}" width="351" height="163" rx="12" fill="{MID}" fill-opacity="0.7" stroke="{DEEP}"/>'
        out += eyebrow(x + 22, y + 32, head)
        yy = y + 72
        for s, size, fill, sup in items:
            out += t(x + 22, yy, s, size, fill, SERIF)
            if sup:
                out += t(x + 30 + len(s) * size * 0.46, yy - size * 0.55, sup, 9, GOLD, MONO, 'letter-spacing="1.5"')
            yy += size + 12
        out += "</g>"
    for x in (412, 792):
        out += f'<path d="M{x} 210 l6 -6 l6 6 l-6 6 z" fill="{MID}" stroke="{GOLD}"/>'
    out += f'<line x1="36" y1="210" x2="1164" y2="210" stroke="{DEEP}" opacity="0.6"/>'
    svg("toolkit.svg", 420, out, "Toolkit. Languages: TypeScript (primary), JavaScript, HTML, CSS. AI and documents: Gemini API, Tesseract OCR, Arabic PDF generation. Frontend: React, Vite, Tailwind, Radix, TanStack Query, Framer Motion. Backend and data: Node.js, Express, Supabase, Zod, Helmet, Nodemailer. Ship: Vercel, Cloudflare, GitHub Pages, Git. Craft: RTL-first UX, Arabic typography, product thinking.", p=p)


# ---------------------------------------------------------------- footer
def footer():
    p = "ft"
    body = f"""
{card(p, 10, 10, 1180, 170, 20, grid=False)}
<text x="600" y="92" text-anchor="middle" font-family="{SERIF}" font-size="44" font-style="italic" fill="{PALE}" class="su">Samir<tspan fill="{GOLD}"> —</tspan></text>
<text x="600" y="126" text-anchor="middle" font-family="{SERIF}" font-size="17" fill="{MUTED}" class="fi" style="animation-delay:.4s">Building products people can actually use — in Arabic, first.</text>
<rect x="430" y="144" width="340" height="1" fill="url(#{p}-line)"/>
<circle cx="600" cy="144" r="3" fill="{PALE}"><animate attributeName="opacity" values=".3;1;.3" dur="3s" repeatCount="indefinite"/></circle>
"""
    svg("footer.svg", 190, body, "Samir — building products people can actually use, in Arabic first.", p=p)


hero()
about()
projects()
toolkit()
footer()
title("title-about.svg", "01", "About", "Hello, I'm", "Samir.", "who I am")
title("title-work.svg", "02", "Selected work", "Built for", "real users.", "shipped · in progress")
title("title-toolkit.svg", "03", "Toolkit", "The tools I", "reach for.", "verified from my repos")
title("title-commits.svg", "04", "Commit log", "A year of", "building.", "live · updated daily")
title("title-connect.svg", "05", "Connect", "Let's build something", "worth using.", "open to work")
print("assets written to", OUT)
