#!/usr/bin/env python3
"""
Recolour hard-coded colours into the "Ink & Oatmeal" palette (palette B).

Each colour keeps its OKLCH lightness, so contrast and visual hierarchy stay as they were;
only hue and chroma move into the palette-B families:

  neutrals (low chroma)         -> warm oatmeal greys
  blue / indigo / violet        -> bronze accent ramp
  teal / cyan                   -> muted slate-teal
  green                         -> calmer green (success)
  yellow / amber (attention)    -> mustard, kept apart from the bronze accent
  red / pink                    -> unchanged (errors)

Usage: palette-remap.py [--write] FILE...   (dry run by default; prints a summary)
"""
import math
import re
import sys

# ---------- colour maths (sRGB <-> OKLab/OKLCH) ----------


def _lin(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def _gam(c):
    c = max(0.0, min(1.0, c))
    return 12.92 * c if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055


def rgb_to_oklch(r, g, b):
    r, g, b = _lin(r), _lin(g), _lin(b)
    l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
    m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
    s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b
    l, m, s = (x ** (1 / 3) if x > 0 else 0 for x in (l, m, s))
    L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s
    a = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s
    bb = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
    C = math.hypot(a, bb)
    H = math.degrees(math.atan2(bb, a)) % 360
    return L, C, H


def oklch_to_rgb(L, C, H):
    a = C * math.cos(math.radians(H))
    b = C * math.sin(math.radians(H))
    l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
    m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
    s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3
    r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
    g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
    bl = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
    return _gam(r), _gam(g), _gam(bl)


def in_gamut(L, C, H):
    a = C * math.cos(math.radians(H))
    b = C * math.sin(math.radians(H))
    l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
    m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
    s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3
    r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
    g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
    bl = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
    return all(-1e-4 <= x <= 1 + 1e-4 for x in (r, g, bl))


def fit(L, C, H):
    while C > 0 and not in_gamut(L, C, H):
        C -= 0.002
    return L, max(C, 0), H


# ---------- the palette-B families ----------

NEUTRAL_HUE = 75  # warm oatmeal
ACCENT_HUE = 62  # bronze (accent #985808)
TEAL_HUE = 205  # slate-teal
GREEN_HUE = 155
MUSTARD_HUE = 95  # attention, distinct from bronze


def remap(L, C, H):
    """Palette-B colour with the same lightness."""
    if C < 0.012:  # true neutrals: warm them, keep them quiet
        c = 0 if L > 0.995 or L < 0.03 else min(0.006 + C * 0.5, 0.010)
        return fit(L, c, NEUTRAL_HUE)
    if 215 <= H < 330:  # blue, indigo, violet
        if L < 0.36 or C < 0.035:  # navies and blue-greys become warm ink / oatmeal greys
            return fit(L, min(0.006 + C * 0.15, 0.012), NEUTRAL_HUE)
        return fit(L, min(C * 0.75, 0.13), ACCENT_HUE)  # the accent itself -> bronze
    if 165 <= H < 215:  # teal, cyan -> slate-teal
        return fit(L, min(C * 0.45, 0.05), TEAL_HUE)
    if 120 <= H < 165:  # green -> calm green
        return fit(L, min(C * 0.8, 0.10), GREEN_HUE)
    if 42 <= H < 120:  # orange, amber, yellow -> mustard
        # Yellow reads lighter than orange at the same lightness, so darken text shades a little.
        return fit(L - 0.05 if L < 0.62 else L, min(C, 0.12), MUSTARD_HUE)
    return L, C, H  # red, pink, orange-red: unchanged


# Colours that are brand marks or semantic danger: never touched.
KEEP = {
    "#c98a12",  # logo signal mark
    "#b42318", "#fff0ee", "#d92d20", "#fef3f2",  # danger
}

HEX = re.compile(r"#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![0-9a-zA-Z_-])")
RGBA = re.compile(r"rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(,\s*[\d.]+\s*)?\)")
OKLCH = re.compile(r"oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)\s*(/\s*[\d.%]+\s*)?\)")


def to_hex(r, g, b):
    return "#%02x%02x%02x" % tuple(round(x * 255) for x in (r, g, b))


def map_hex(h):
    low = h.lower()
    if len(low) == 4:
        low = "#" + "".join(ch * 2 for ch in low[1:])
    if low in KEEP or low in ("#ffffff", "#000000"):
        return h
    r, g, b = (int(low[i : i + 2], 16) / 255 for i in (1, 3, 5))
    out = to_hex(*oklch_to_rgb(*remap(*rgb_to_oklch(r, g, b))))
    return out if out != low else h


def map_rgba(m):
    r, g, b = (int(m.group(i)) / 255 for i in (1, 2, 3))
    nr, ng, nb = oklch_to_rgb(*remap(*rgb_to_oklch(r, g, b)))
    vals = ", ".join(str(round(x * 255)) for x in (nr, ng, nb))
    alpha = m.group(4) or ""
    return f"rgba({vals}{alpha})" if alpha else f"rgb({vals})"


def map_oklch(m):
    L = float(m.group(1)) / (100 if m.group(2) else 1)
    C, H = float(m.group(3)), float(m.group(4))
    nL, nC, nH = remap(L, C, H)
    lstr = f"{nL * 100:.1f}%" if m.group(2) else f"{nL:.3f}"
    tail = f" {m.group(5).strip()}" if m.group(5) else ""
    return f"oklch({lstr} {nC:.3f} {nH:.0f}{tail})"


def transform(text):
    text = HEX.sub(lambda m: map_hex(m.group(0)), text)
    text = RGBA.sub(map_rgba, text)
    text = OKLCH.sub(map_oklch, text)
    return text


def main(argv):
    write = "--write" in argv
    files = [a for a in argv if a != "--write"]
    changed = 0
    for path in files:
        src = open(path, encoding="utf-8").read()
        out = transform(src)
        if out != src:
            changed += 1
            if write:
                open(path, "w", encoding="utf-8").write(out)
    print(f"{'wrote' if write else 'would change'} {changed} of {len(files)} files")


if __name__ == "__main__":
    main(sys.argv[1:])
