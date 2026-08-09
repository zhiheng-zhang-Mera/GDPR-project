"""Generate deterministic Android launcher and splash rasters from approved brand masters."""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
IMAGE_DIR = ROOT / "assets" / "images"
RES = ROOT / "android" / "app" / "src" / "main" / "res"
ICON = Image.open(IMAGE_DIR / "privacy-lens-icon.png").convert("RGB")
FOREGROUND = Image.open(IMAGE_DIR / "privacy-lens-foreground.png").convert("RGBA")
BACKGROUND = (11, 92, 85, 255)

DENSITIES = {
    "mdpi": 1.0,
    "hdpi": 1.5,
    "xhdpi": 2.0,
    "xxhdpi": 3.0,
    "xxxhdpi": 4.0,
}


def fit(image: Image.Image, size: int, padding: float = 0.0, background=None) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), background or (0, 0, 0, 0))
    target = max(1, round(size * (1 - 2 * padding)))
    resized = image.copy()
    resized.thumbnail((target, target), Image.Resampling.LANCZOS)
    canvas.alpha_composite(resized, ((size - resized.width) // 2, (size - resized.height) // 2))
    return canvas


for density, scale in DENSITIES.items():
    mipmap = RES / f"mipmap-{density}"
    drawable = RES / f"drawable-{density}"
    mipmap.mkdir(parents=True, exist_ok=True)
    drawable.mkdir(parents=True, exist_ok=True)

    legacy_size = round(48 * scale)
    legacy = fit(ICON.convert("RGBA"), legacy_size)
    legacy.save(mipmap / "ic_launcher.webp", "WEBP", quality=95, method=6)
    legacy.save(mipmap / "ic_launcher_round.webp", "WEBP", quality=95, method=6)

    adaptive_size = round(108 * scale)
    adaptive_foreground = fit(FOREGROUND, adaptive_size, padding=0.08)
    adaptive_foreground.save(mipmap / "ic_launcher_foreground.webp", "WEBP", lossless=True, method=6)
    Image.new("RGBA", (adaptive_size, adaptive_size), BACKGROUND).save(mipmap / "ic_launcher_background.webp", "WEBP", lossless=True, method=6)

    alpha = adaptive_foreground.getchannel("A")
    monochrome = Image.new("RGBA", (adaptive_size, adaptive_size), (255, 255, 255, 0))
    monochrome.putalpha(alpha)
    monochrome.save(mipmap / "ic_launcher_monochrome.webp", "WEBP", lossless=True, method=6)

    splash_size = round(200 * scale)
    splash = fit(ICON.convert("RGBA"), splash_size, padding=0.12)
    splash.save(drawable / "splashscreen_logo.png", "PNG", optimize=True)

print("Generated Privacy Lens launcher and splash assets for five Android densities.")
