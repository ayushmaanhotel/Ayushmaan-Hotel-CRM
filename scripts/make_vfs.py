import os
import base64

def b64_file(p):
    with open(p, 'rb') as f:
        return base64.b64encode(f.read()).decode('utf-8')

inter_b64 = b64_file('fonts/Inter-Regular.ttf')
inter_it_b64 = b64_file('fonts/Inter-Italic.ttf')
playfair_b64 = b64_file('fonts/PlayfairDisplay-Regular.ttf')
playfair_it_b64 = b64_file('fonts/PlayfairDisplay-Italic.ttf')
devanagari_b64 = b64_file('fonts/NotoSansDevanagari-Regular.ttf')

os.makedirs('src/lib', exist_ok=True)
with open('src/lib/vfs-fonts.ts', 'w', encoding='utf-8') as f:
    f.write('/* GENERATED VFS FONTS — Offline vector PDF font bundle with Rupee and Devanagari */\n')
    f.write(f'const interB64 = "{inter_b64}";\n')
    f.write(f'const interItB64 = "{inter_it_b64}";\n')
    f.write(f'const playfairB64 = "{playfair_b64}";\n')
    f.write(f'const playfairItB64 = "{playfair_it_b64}";\n')
    f.write(f'const devanagariB64 = "{devanagari_b64}";\n\n')
    f.write('export const vfs: Record<string, string> = {\n')
    f.write('  "Inter-Regular.ttf": interB64,\n')
    f.write('  "Inter-SemiBold.ttf": interB64,\n')
    f.write('  "Inter-Italic.ttf": interItB64,\n')
    f.write('  "Inter-SemiBoldItalic.ttf": interItB64,\n')
    f.write('  "PlayfairDisplay-Regular.ttf": playfairB64,\n')
    f.write('  "PlayfairDisplay-SemiBold.ttf": playfairB64,\n')
    f.write('  "PlayfairDisplay-Italic.ttf": playfairItB64,\n')
    f.write('  "PlayfairDisplay-SemiBoldItalic.ttf": playfairItB64,\n')
    f.write('  "NotoSansDevanagari-Regular.ttf": devanagariB64,\n')
    f.write('  "NotoSansDevanagari-SemiBold.ttf": devanagariB64,\n')
    f.write('};\n')

print('Generated src/lib/vfs-fonts.ts! Size:', os.path.getsize('src/lib/vfs-fonts.ts'))
