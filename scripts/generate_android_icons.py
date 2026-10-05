import os
from PIL import Image, ImageDraw

src_path = r"C:\Users\ayush\.gemini\antigravity\brain\7d7f42d2-d58f-4064-a972-90c193435738\.user_uploaded\media_1791035407393.png"
res_dir = r"C:\Users\ayush\.gemini\antigravity\scratch\ayushmaan-os-v2\android\app\src\main\res"

im = Image.open(src_path).convert("RGBA")

# Ensure source is square
size = min(im.width, im.height)
left = (im.width - size) // 2
top = (im.height - size) // 2
im_square = im.crop((left, top, left + size, top + size))

densities = [
    ("mdpi", 48, 108),
    ("hdpi", 72, 162),
    ("xhdpi", 96, 216),
    ("xxhdpi", 144, 324),
    ("xxxhdpi", 192, 432)
]

for name, size_px, fg_size in densities:
    folder = os.path.join(res_dir, f"mipmap-{name}")
    os.makedirs(folder, exist_ok=True)
    
    # 1. Standard square/squircle icon
    std_icon = im_square.resize((size_px, size_px), Image.Resampling.LANCZOS)
    std_icon.save(os.path.join(folder, "ic_launcher.png"), "PNG")
    
    # 2. Round icon (masked circle)
    round_icon = Image.new("RGBA", (size_px, size_px), (0, 0, 0, 0))
    mask = Image.new("L", (size_px, size_px), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size_px, size_px), fill=255)
    round_icon.paste(std_icon, (0, 0), mask=mask)
    round_icon.save(os.path.join(folder, "ic_launcher_round.png"), "PNG")
    
    # 3. Adaptive Foreground
    # Central 72/108 zone: scale icon to ~74% so document & rupee stay completely inside safe area
    fg_icon = Image.new("RGBA", (fg_size, fg_size), (0, 0, 0, 0))
    inner_size = int(fg_size * 0.74)
    offset = (fg_size - inner_size) // 2
    inner_im = im_square.resize((inner_size, inner_size), Image.Resampling.LANCZOS)
    fg_icon.paste(inner_im, (offset, offset), mask=inner_im)
    fg_icon.save(os.path.join(folder, "ic_launcher_foreground.png"), "PNG")
    
    print(f"Generated {name}: launcher={size_px}px, round={size_px}px, fg={fg_size}px")

# Also web favicon and pwa icon
public_dir = r"C:\Users\ayush\.gemini\antigravity\scratch\ayushmaan-os-v2\public"
im_square.resize((192, 192), Image.Resampling.LANCZOS).save(os.path.join(public_dir, "icon-192.png"), "PNG")
im_square.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(public_dir, "icon-512.png"), "PNG")
im_square.resize((64, 64), Image.Resampling.LANCZOS).save(os.path.join(public_dir, "favicon.png"), "PNG")
print("Web icons saved to public/")
