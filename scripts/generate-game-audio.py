# -*- coding: utf-8 -*-
"""Original, deterministic short game cues; no recordings or third-party samples."""
import math
from pathlib import Path
import struct
import wave

DEST = Path(__file__).resolve().parent.parent / 'assets' / 'audio'
DEST.mkdir(parents=True, exist_ok=True)
RATE = 22050
for name, notes in {'coin': [659.25, 880], 'complete': [523.25, 659.25, 783.99, 1046.5]}.items():
    samples = []
    for frequency in notes:
        duration = 0.105
        for n in range(int(RATE * duration)):
            t = n / RATE
            envelope = min(t / 0.009, 1) * max(0, 1 - t / duration) ** 2
            value = 0.18 * envelope * (math.sin(2 * math.pi * frequency * t) + 0.2 * math.sin(4 * math.pi * frequency * t))
            samples.append(struct.pack('<h', int(value * 32767)))
    with wave.open(str(DEST / (name + '.wav')), 'wb') as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(RATE)
        output.writeframes(b''.join(samples))
