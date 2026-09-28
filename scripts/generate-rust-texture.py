# -*- coding: utf-8 -*-
"""Procedural seamless rust albedo for the arena gears — no third-party samples."""
from __future__ import annotations

import math
from pathlib import Path

from PIL import Image

DEST = Path(__file__).resolve().parent.parent / 'assets' / 'scene' / 'textures'
DEST.mkdir(parents=True, exist_ok=True)
SIZE = 512


def _hash(x: int, y: int, seed: int) -> float:
    # Wrap to period so the map tiles without a seam.
    x %= 64
    y %= 64
    n = (x * 374761393 + y * 668265263 + seed * 1274126177) & 0x7FFFFFFF
    n = (n ^ (n >> 13)) * 1274126177
    return ((n ^ (n >> 16)) & 0x7FFFFFFF) / 0x7FFFFFFF


def _value_noise(x: float, y: float, seed: int) -> float:
    x0 = math.floor(x)
    y0 = math.floor(y)
    fx = x - x0
    fy = y - y0
    ux = fx * fx * (3 - 2 * fx)
    uy = fy * fy * (3 - 2 * fy)
    a = _hash(x0, y0, seed)
    b = _hash(x0 + 1, y0, seed)
    c = _hash(x0, y0 + 1, seed)
    d = _hash(x0 + 1, y0 + 1, seed)
    return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy


def _fbm(x: float, y: float, seed: int, octaves: int = 5) -> float:
    total = 0.0
    amp = 0.5
    freq = 1.0
    for i in range(octaves):
        total += amp * _value_noise(x * freq, y * freq, seed + i * 17)
        freq *= 2.0
        amp *= 0.5
    return total


def rust_pixel(u: float, v: float) -> tuple[int, int, int]:
    # u,v in [0, 64) — matches the hash period.
    base = _fbm(u, v, 3)
    blot = _fbm(u * 0.55, v * 0.55, 11)
    fine = _fbm(u * 2.2, v * 2.2, 29)

    rust = max(0.0, blot * 1.35 - 0.35)
    pit = max(0.0, fine - 0.55) * 1.4

    steel_r = 48 + base * 28
    steel_g = 46 + base * 24
    steel_b = 44 + base * 22

    rust_r = 118 + rust * 90 + fine * 20
    rust_g = 52 + rust * 40 + fine * 10
    rust_b = 28 + rust * 18

    mix = min(1.0, rust * 1.2)
    r = steel_r * (1 - mix) + rust_r * mix
    g = steel_g * (1 - mix) + rust_g * mix
    b = steel_b * (1 - mix) + rust_b * mix

    r *= 1 - pit * 0.55
    g *= 1 - pit * 0.55
    b *= 1 - pit * 0.5

    return (
        max(0, min(255, int(r))),
        max(0, min(255, int(g))),
        max(0, min(255, int(b))),
    )


def main() -> None:
    image = Image.new('RGB', (SIZE, SIZE))
    pixels = image.load()
    for y in range(SIZE):
        for x in range(SIZE):
            u = (x / SIZE) * 64.0
            v = (y / SIZE) * 64.0
            pixels[x, y] = rust_pixel(u, v)
    path = DEST / 'rust.png'
    image.save(path, optimize=True)
    print(f'Wrote {path} ({SIZE}×{SIZE})')


if __name__ == '__main__':
    main()
