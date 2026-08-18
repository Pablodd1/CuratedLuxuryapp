"""Instruction photos: real Unsplash frames + a generated serial plate."""
from __future__ import annotations

import io
import math
import random
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "static" / "examples"
CANDS = Path(r"C:/Users/jasme/AppData/Local/Temp/clqa/cands")
OUT.mkdir(parents=True, exist_ok=True)
UA = "CuratedLuxExampleBuilder/1.0"


def font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for p in (r"C:\Windows\Fonts\arial.ttf", r"C:\Windows\Fonts\segoeui.ttf"):
        try:
            return ImageFont.truetype(p, size)
        except OSError:
            pass
    return ImageFont.load_default()


def fetch(url: str) -> Image.Image:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=40) as r:
        return Image.open(io.BytesIO(r.read())).convert("RGB")


def open_local(name: str) -> Image.Image:
    return Image.open(CANDS / name).convert("RGB")


def fit(img: Image.Image, size=(720, 720)) -> Image.Image:
    return ImageOps.fit(img, size, Image.Resampling.LANCZOS)


def save(img: Image.Image, name: str) -> None:
    path = OUT / name
    img.convert("RGB").save(path, "JPEG", quality=88, optimize=True)
    print(f"  {path.name:22} {path.stat().st_size:7d}b")


def brushed_metal(size: int) -> Image.Image:
    rnd = random.Random(42)
    img = Image.new("RGB", (size, size), (168, 172, 176))
    px = img.load()
    for y in range(size):
        shade = 150 + int(28 * math.sin(y / 7.0))
        for x in range(size):
            n = rnd.randint(-18, 18)
            v = max(80, min(230, shade + n + int(12 * math.sin(x / 40.0))))
            px[x, y] = (v, v + 1, v + 3)
    img = img.filter(ImageFilter.GaussianBlur(0.6))
    return img


def make_caseback(good: bool) -> Image.Image:
    size = 720
    metal = brushed_metal(size)
    overlay = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    cx = cy = size // 2
    d.ellipse((48, 48, size - 48, size - 48), outline=(60, 62, 64, 255), width=18)
    d.ellipse((78, 78, size - 78, size - 78), outline=(210, 214, 218, 220), width=3)
    # raking highlight
    d.pieslice((90, 90, size - 90, size - 90), 210, 250, fill=(255, 255, 255, 28))
    metal = Image.alpha_composite(metal.convert("RGBA"), overlay)
    draw = ImageDraw.Draw(metal)
    draw.text((cx, 210), "SAMPLE PLATE", font=font(22), fill=(40, 42, 44), anchor="mm")
    draw.text((cx, 300), "A7F2  2918", font=font(54), fill=(28, 28, 30), anchor="mm")
    draw.text((cx, 370), "904L   ·   SWISS MADE", font=font(22), fill=(50, 52, 54), anchor="mm")
    draw.text((cx, 470), "SERIAL MUST FILL THE FRAME", font=font(16), fill=(70, 72, 74), anchor="mm")
    # focus box
    draw.rectangle((160, 250, 560, 400), outline=(16, 185, 129) if good else (239, 68, 68), width=3)
    if not good:
        small = ImageOps.fit(metal.convert("RGB"), (240, 240))
        canvas = Image.new("RGB", (size, size), (16, 16, 16))
        canvas.paste(small, (380, 80))
        return canvas.filter(ImageFilter.GaussianBlur(3.2))
    return metal.convert("RGB")


def make_card(good: bool) -> Image.Image:
    canvas = Image.new("RGB", (720, 720), (18, 18, 18))
    card = Image.new("RGB", (540, 340), (244, 240, 232))
    d = ImageDraw.Draw(card)
    d.rectangle((0, 0, 539, 339), outline=(120, 110, 96), width=2)
    d.text((28, 24), "WARRANTY  ·  CERTIFICATE", font=font(18), fill=(40, 36, 30))
    d.line((28, 58, 510, 58), fill=(180, 160, 90), width=2)
    d.text((28, 86), "Reference", font=font(14), fill=(110, 100, 90))
    d.text((28, 108), "126610LN", font=font(36), fill=(20, 18, 16))
    d.text((28, 170), "Serial", font=font(14), fill=(110, 100, 90))
    d.text((28, 192), "A7F2 2918", font=font(28), fill=(20, 18, 16))
    d.rectangle((28, 260, 170, 300), fill=(138, 28, 44))
    if good:
        canvas.paste(card, (90, 190))
        return canvas
    # curled + shadowed
    warped = card.rotate(11, expand=True, fillcolor=(18, 18, 18))
    warped = ImageEnhance.Brightness(warped).enhance(0.72)
    canvas.paste(warped, (40, 80))
    shade = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    ImageDraw.Draw(shade).polygon([(80, 200), (620, 120), (640, 520), (60, 560)], fill=(0, 0, 0, 110))
    return Image.alpha_composite(canvas.convert("RGBA"), shade).convert("RGB")


def main() -> None:
    print("rebuild", OUT)

    # Dial: tight face crop of the more frontal Festina vs lifestyle 3/4 as not-this
    dial_src = open_local("b.jpg")
    w, h = dial_src.size
    dial_good = fit(dial_src.crop((int(w * 0.28), int(h * 0.42), int(w * 0.72), int(h * 0.78))))
    dial_bad = fit(open_local("a.jpg"))
    save(dial_good, "dial-good.jpg")
    save(dial_bad, "dial-bad.jpg")
    save(fit(dial_src, (1100, 720)), "prep-dial.jpg")

    save(make_caseback(True), "macro-good.jpg")
    save(make_caseback(False), "macro-bad.jpg")

    save(make_card(True), "card-good.jpg")
    save(make_card(False), "card-bad.jpg")

    bag_good = fit(open_local("d.jpg"))
    bag_bad = fit(open_local("c.jpg"))
    save(bag_good, "bag-good.jpg")
    save(bag_bad, "bag-bad.jpg")
    save(fit(open_local("d.jpg"), (1100, 720)), "prep-bag.jpg")

    # Keep remaining categories from previous Unsplash build if present; else skip.
    extras = {
        "gem": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1400&q=80",
        "car": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=80",
        "dash": "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1400&q=80",
        "art": "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1400&q=80",
    }
    crops = {
        "gem": (0.18, 0.10, 0.82, 0.88),
        "car": (0.04, 0.18, 0.96, 0.88),
        "dash": (0.14, 0.16, 0.86, 0.80),
        "art": (0.16, 0.06, 0.84, 0.96),
    }
    for key, url in extras.items():
        raw = fetch(url)
        w, h = raw.size
        l, t, r, b = crops[key]
        good = fit(raw.crop((int(w * l), int(h * t), int(w * r), int(h * b))))
        bad = good.rotate(-14, expand=True, fillcolor=(8, 8, 8))
        bad = fit(bad)
        glare = Image.new("RGBA", bad.size, (0, 0, 0, 0))
        ImageDraw.Draw(glare).ellipse((80, 40, 640, 360), fill=(255, 255, 255, 130))
        bad = Image.alpha_composite(bad.convert("RGBA"), glare).convert("RGB")
        save(good, f"{key}-good.jpg")
        save(bad, f"{key}-bad.jpg")
        save(fit(raw, (1100, 720)), f"prep-{key}.jpg")
    print("done")


if __name__ == "__main__":
    main()
