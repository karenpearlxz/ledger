#!/usr/bin/env python3
"""Ledger app icons: a cream page with a deep ink serif L and a gold rule."""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "client/public/icons"
OUT.mkdir(parents=True, exist_ok=True)

INK = (20, 19, 15)
CREAM = (246, 241, 230)
GOLD = (181, 122, 31)

CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf",
]


def font(size):
    for p in CANDIDATES:
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def draw(size, maskable=False):
    img = Image.new("RGB", (size, size), INK)
    d = ImageDraw.Draw(img)
    # Maskable icons get cropped to a circle on Android, so the artwork sits
    # inside the safe zone with plain background around it.
    pad = int(size * 0.20) if maskable else int(size * 0.11)
    d.rounded_rectangle([pad, pad, size - pad, size - pad],
                        radius=int(size * (0.06 if maskable else 0.20)), fill=CREAM)

    inner = size - pad * 2
    f = font(int(inner * 0.62))
    box = d.textbbox((0, 0), "L", font=f)
    d.text((pad + (inner - (box[2] - box[0])) / 2 - box[0],
            pad + (inner - (box[3] - box[1])) / 2 - box[1] - inner * 0.06),
           "L", font=f, fill=INK)

    rule_y = pad + inner * 0.80
    d.rectangle([pad + inner * 0.26, rule_y, size - pad - inner * 0.26, rule_y + max(2, inner * 0.035)],
                fill=GOLD)
    return img


draw(192).save(OUT / "icon-192.png")
draw(512).save(OUT / "icon-512.png")
draw(512, maskable=True).save(OUT / "maskable-512.png")
draw(180).save(OUT / "apple-touch-icon.png")
print("icons ->", ", ".join(sorted(p.name for p in OUT.iterdir())))
