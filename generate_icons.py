#!/usr/bin/env python3
"""
Generate clean, flat-design tool icons as WebP files.
Each icon: 256x256, rounded-square with brand color, white letter(s).
"""
from PIL import Image, ImageDraw, ImageFont
import os, sys

OUT = "/Users/svensieber/Desktop/Work/Webseite_portfolio/public/icons"
SIZE = 256
RADIUS = 48  # corner radius

# ── Icon definitions: (filename, label, bg_hex, fg_hex) ──
ICONS = [
    # 1. UX & Design Tools
    ("figma",           "Fi",  "#1E1E1E", "#A259FF"),
    ("sketch",          "Sk",  "#FDB300", "#FFFFFF"),
    ("adobe_xd",        "Xd",  "#470137", "#FF61F6"),
    ("illustrator",     "Ai",  "#330000", "#FF9A00"),
    ("photoshop",       "Ps",  "#001E36", "#31A8FF"),
    ("canva",           "Ca",  "#7D2AE8", "#00C4CC"),

    # 2. CMS & E-Commerce
    ("wordpress",       "Wp",  "#21759B", "#FFFFFF"),
    ("woocommerce",     "Wc",  "#7F54B3", "#FFFFFF"),
    ("jtl5",            "JTL", "#0A2240", "#00AEEF"),
    ("shopify",         "Sh",  "#96BF48", "#FFFFFF"),
    ("webflow",         "Wf",  "#4353FF", "#FFFFFF"),
    ("hubspot",         "Hs",  "#FF7A59", "#FFFFFF"),

    # 3. Frontend Development
    ("react",           "Re",  "#20232A", "#61DAFB"),
    ("typescript",      "TS",  "#3178C6", "#FFFFFF"),
    ("tailwindcss",     "Tw",  "#0F172A", "#38BDF8"),
    ("daisyui",         "dU",  "#1AD1A5", "#FFFFFF"),
    ("cursor",          "Cu",  "#000000", "#FFFFFF"),

    # 4. Backend & Automation
    ("python",          "Py",  "#306998", "#FFD43B"),
    ("mysql",           "My",  "#00618A", "#F29111"),
    ("supabase",        "Sb",  "#1C1C1C", "#3ECF8E"),
    ("vercel",          "Ve",  "#000000", "#FFFFFF"),
    ("fastapi",         "Fa",  "#009688", "#FFFFFF"),
    ("n8n",             "n8",  "#EA4B71", "#FFFFFF"),

    # 5. Data Insights & AI
    ("pandas",          "Pd",  "#130654", "#E70488"),
    ("matplotlib",      "Mp",  "#11557C", "#FFFFFF"),
    ("numpy_scipy",     "Np",  "#4DABCF", "#013243"),
    ("tableau_powerbi", "Tb",  "#E97627", "#FFFFFF"),
    ("claude_code",     "Cl",  "#D4A574", "#1A1A1A"),
    ("runway",          "Rw",  "#000000", "#00F0FF"),

    # 6. Experimental Development
    ("ag2",             "AG",  "#6C3AED", "#FFFFFF"),
    ("langchain",       "Lc",  "#1C3C3C", "#3DDC84"),
    ("huggingface",     "HF",  "#FFD21E", "#000000"),
    ("docker",          "Dk",  "#2496ED", "#FFFFFF"),
    ("web3_threejs",    "3D",  "#000000", "#049EF4"),
]


def hex_to_rgb(h: str) -> tuple:
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


def make_icon(filename: str, label: str, bg_hex: str, fg_hex: str):
    bg = hex_to_rgb(bg_hex)
    fg = hex_to_rgb(fg_hex)

    img  = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Rounded rectangle background
    draw.rounded_rectangle(
        [(0, 0), (SIZE - 1, SIZE - 1)],
        radius=RADIUS,
        fill=bg,
    )

    # Subtle inner border (1px lighter)
    border_col = tuple(min(c + 40, 255) for c in bg) + (80,)
    draw.rounded_rectangle(
        [(2, 2), (SIZE - 3, SIZE - 3)],
        radius=RADIUS - 2,
        outline=border_col,
        width=2,
    )

    # Try to use a nice font, fall back to default
    font = None
    font_size = SIZE // 3 if len(label) <= 2 else SIZE // 4
    for font_path in [
        "/System/Library/Fonts/SFNSMono.ttf",
        "/System/Library/Fonts/Menlo.ttc",
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/SFNS.ttf",
        "/Library/Fonts/Arial.ttf",
    ]:
        if os.path.exists(font_path):
            try:
                font = ImageFont.truetype(font_path, font_size)
                break
            except:
                pass
    if font is None:
        font = ImageFont.load_default()

    # Center the text
    bbox = draw.textbbox((0, 0), label, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = (SIZE - tw) // 2
    ty = (SIZE - th) // 2 - bbox[1]  # compensate for ascent offset
    draw.text((tx, ty), label, fill=fg, font=font)

    # Save as WebP
    path = os.path.join(OUT, f"{filename}.webp")
    img.save(path, "WEBP", quality=90)
    return path


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for filename, label, bg, fg in ICONS:
        p = make_icon(filename, label, bg, fg)
        print(f"  ✓ {p}")
    print(f"\n✅ {len(ICONS)} Icons erstellt in {OUT}")
