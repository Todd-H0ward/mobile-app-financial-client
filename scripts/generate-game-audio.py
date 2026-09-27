# -*- coding: utf-8 -*-
"""Original, deterministic short game cues; no recordings or third-party samples."""
import math
from pathlib import Path
import struct
import wave

DEST = Path(__file__).resolve().parent.parent / 'assets' / 'audio'
DEST.mkdir(parents=True, exist_ok=True)
RATE = 22050


def tone(frequency, duration, volume=0.18, harm=0.2, attack=0.009):
    samples = []
    for n in range(int(RATE * duration)):
        t = n / RATE
        envelope = min(t / attack, 1) * max(0, 1 - t / duration) ** 2
        value = (
            volume
            * envelope
            * (
                math.sin(2 * math.pi * frequency * t)
                + harm * math.sin(4 * math.pi * frequency * t)
            )
        )
        samples.append(value)
    return samples


def noise(duration, volume=0.12, attack=0.005):
    """Deterministic soft noise (no random) for whooshes and flinches."""
    samples = []
    seed = 1
    for n in range(int(RATE * duration)):
        t = n / RATE
        seed = (seed * 1103515245 + 12345) & 0x7FFFFFFF
        raw = (seed / 0x7FFFFFFF) * 2 - 1
        envelope = min(t / attack, 1) * max(0, 1 - t / duration) ** 1.5
        samples.append(volume * envelope * raw)
    return samples


def mix(*parts):
    out = []
    for part in parts:
        out.extend(part)
    return out


def write(name, samples):
    packed = b''.join(
        struct.pack('<h', max(-32767, min(32767, int(v * 32767))))
        for v in samples
    )
    with wave.open(str(DEST / (name + '.wav')), 'wb') as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(RATE)
        output.writeframes(packed)


# Soft UI clicks
write('ui_tap', tone(880, 0.045, volume=0.12, harm=0.05, attack=0.003))
write('ui_confirm', mix(tone(660, 0.05, 0.14), tone(990, 0.07, 0.12)))
write('ui_back', tone(440, 0.055, volume=0.11, harm=0.05, attack=0.004))

# Navigation / cells
write(
    'nav_whoosh',
    mix(
        [s * 0.7 for s in noise(0.08, 0.1)],
        tone(220, 0.1, 0.08, harm=0.0, attack=0.02),
    ),
)
write('cell_hold', tone(520, 0.09, volume=0.1, harm=0.15, attack=0.02))
write('cell_open', mix(tone(523.25, 0.06, 0.14), tone(783.99, 0.08, 0.12)))

# Economy (keep coin / complete character, add spend + lift)
write('coin', mix(tone(659.25, 0.105), tone(880, 0.105)))
write('spend', mix(tone(523.25, 0.07, 0.14), tone(392, 0.09, 0.12)))
write(
    'complete',
    mix(
        tone(523.25, 0.105),
        tone(659.25, 0.105),
        tone(783.99, 0.105),
        tone(1046.5, 0.105),
    ),
)
write(
    'lift',
    mix(
        tone(196, 0.12, 0.14, harm=0.3, attack=0.03),
        tone(294, 0.14, 0.12, harm=0.2, attack=0.02),
        tone(392, 0.16, 0.1, harm=0.15, attack=0.02),
    ),
)

# Lesson / arcade verdicts
write('correct', mix(tone(587.33, 0.07, 0.15), tone(880, 0.1, 0.14)))
write(
    'wrong',
    mix(
        tone(311.13, 0.09, 0.14, harm=0.4),
        tone(233.08, 0.12, 0.12, harm=0.3),
    ),
)

# Keeper — warm, rounded
write('keeper_on', mix(tone(349.23, 0.08, 0.12), tone(523.25, 0.1, 0.11)))
write(
    'keeper_talk',
    mix(
        tone(392, 0.04, 0.1, harm=0.05),
        tone(466.16, 0.045, 0.09, harm=0.05),
        tone(523.25, 0.05, 0.08, harm=0.05),
    ),
)
write('keeper_off', tone(349.23, 0.08, volume=0.1, harm=0.05, attack=0.01))

# Overseer — sharp, digital
write(
    'overseer_on',
    mix(
        tone(740, 0.05, 0.14, harm=0.5),
        tone(987.77, 0.06, 0.12, harm=0.45),
    ),
)
write(
    'overseer_talk',
    mix(
        tone(880, 0.035, 0.12, harm=0.6),
        tone(740, 0.035, 0.11, harm=0.55),
        tone(987.77, 0.04, 0.1, harm=0.5),
    ),
)
write(
    'overseer_off',
    mix(tone(987.77, 0.05, 0.12, harm=0.5), tone(554.37, 0.08, 0.1, harm=0.4)),
)

# Robot dog bond
write('dog_enter', mix(tone(493.88, 0.06, 0.12), tone(739.99, 0.08, 0.11)))
write('dog_exit', tone(493.88, 0.07, volume=0.1, harm=0.1, attack=0.01))
write(
    'dog_stroke_joy',
    mix(tone(659.25, 0.06, 0.13), tone(880, 0.07, 0.11), tone(1046.5, 0.08, 0.1)),
)
write(
    'dog_stroke_soft',
    mix(tone(392, 0.08, 0.1, harm=0.1), tone(493.88, 0.09, 0.09, harm=0.08)),
)
write(
    'dog_kick_play',
    mix(tone(587.33, 0.05, 0.13), tone(783.99, 0.06, 0.12), [s * 0.5 for s in noise(0.04, 0.08)]),
)
write(
    'dog_kick_flinch',
    mix(
        [s * 0.8 for s in noise(0.05, 0.12)],
        tone(277.18, 0.08, 0.12, harm=0.4),
    ),
)

print(f'Wrote {len(list(DEST.glob("*.wav")))} cues to {DEST}')
