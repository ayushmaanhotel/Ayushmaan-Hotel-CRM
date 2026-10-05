#!/usr/bin/env python3
"""Fetch OFL variable fonts, pin weights, subset glyphs -> fonts/*.ttf (tiny)."""
import urllib.request, pathlib, io
from fontTools import varLib, subset
from fontTools.varLib import instancer
from fontTools.ttLib import TTFont

OUT = pathlib.Path('fonts'); OUT.mkdir(exist_ok=True)
BASE = 'https://raw.githubusercontent.com/google/fonts/main/ofl/'
UNICODES = ("U+0020-007E,U+00A0,U+00B7,U+00D7,U+2013-2014,U+2018-2019,U+201C-201D,"
            "U+2026,U+20B9,U+2212,U+200C-200D,U+0900-097F,U+0964-0965")

JOBS = [
    # (url, axis pins, out name)
    (BASE + 'inter/Inter%5Bopsz,wght%5D.ttf',            {'opsz': 14, 'wght': 400}, 'Inter-Regular.ttf'),
    (BASE + 'inter/Inter%5Bopsz,wght%5D.ttf',            {'opsz': 14, 'wght': 600}, 'Inter-SemiBold.ttf'),
    (BASE + 'playfairdisplay/PlayfairDisplay%5Bwght%5D.ttf',   {'wght': 400}, 'PlayfairDisplay-Regular.ttf'),
    (BASE + 'playfairdisplay/PlayfairDisplay%5Bwght%5D.ttf',   {'wght': 600}, 'PlayfairDisplay-SemiBold.ttf'),
    (BASE + 'playfairdisplay/PlayfairDisplay-Italic%5Bwght%5D.ttf', {'wght': 400}, 'PlayfairDisplay-Italic.ttf'),
    (BASE + 'notosansdevanagari/NotoSansDevanagari%5Bwdth,wght%5D.ttf',  {'wdth': 100, 'wght': 400}, 'NotoSansDevanagari-Regular.ttf'),
    (BASE + 'notosansdevanagari/NotoSansDevanagari%5Bwdth,wght%5D.ttf',  {'wdth': 100, 'wght': 600}, 'NotoSansDevanagari-SemiBold.ttf'),
]

cache = {}
def get(url):
    if url not in cache:
        print('fetch', url.split('/ofl/')[-1])
        with urllib.request.urlopen(url) as r:
            cache[url] = r.read()
    return io.BytesIO(cache[url])

for url, pins, name in JOBS:
    font = varLib.TTFont(get(url))
    instancer.instantiateVariableFont(font, pins, inplace=True)
    opts = subset.Options()
    opts.layout_features = ['*']
    opts.name_IDs = ['*']
    opts.notdef_outline = True
    ss = subset.Subsetter(options=opts)
    codes = set()
    for part in UNICODES.split(','):
        p = part.replace('U+', '')
        if '-' in p:
            a, b = p.split('-'); codes.update(range(int(a, 16), int(b, 16) + 1))
        else:
            codes.add(int(p, 16))
    ss.populate(unicodes=codes)
    ss.subset(font)
    font.save(str(OUT / name))
    print('  ->', name, (OUT / name).stat().st_size // 1024, 'KB')
