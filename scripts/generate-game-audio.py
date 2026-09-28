# -*- coding: utf-8 -*-
"""Original, deterministic short game cues; no recordings or third-party samples.

AI voices are techno gibberish (`techno_babble`): Keeper calm and warm,
Overseer clipped and aggressive — no real speech.
"""
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


def _rng(seed):
    return (seed * 1103515245 + 12345) & 0x7FFFFFFF


def techno_babble(
    duration,
    *,
    seed,
    base_f,
    spread=0.18,
    syllable_ms=55,
    gap_ms=35,
    volume=0.14,
    harsh=0.0,
    warmth=0.25,
    vibrato=0.0,
    attack=0.008,
):
    """
    Techno gibberish — syllable bursts with no real words.
    Keeper: low, warm, slow. Overseer: high, harsh, clipped.
    """
    samples = []
    t = 0.0
    state = seed
    end = duration

    while t < end:
        state = _rng(state)
        pitch = base_f * (1 + spread * ((state / 0x7FFFFFFF) * 2 - 1))
        state = _rng(state)
        syllable = (syllable_ms / 1000) * (0.65 + 0.7 * (state / 0x7FFFFFFF))
        state = _rng(state)
        gap = (gap_ms / 1000) * (0.45 + 0.9 * (state / 0x7FFFFFFF))

        n_syl = int(RATE * syllable)
        for n in range(n_syl):
            if t >= end:
                break
            local = n / RATE
            envelope = min(local / attack, 1.0) * max(0.0, 1 - local / syllable) ** 1.15
            vib = 1 + vibrato * math.sin(2 * math.pi * 4.5 * (t + local))
            freq = pitch * vib
            wave = math.sin(2 * math.pi * freq * local)
            wave += warmth * math.sin(4 * math.pi * freq * local)
            if harsh > 0:
                # Hard edge — square + faint saw, aggressive machine talk.
                phase = (local * freq) % 1.0
                wave += harsh * 0.45 * (1.0 if phase < 0.5 else -1.0)
                wave += harsh * 0.2 * (phase * 2 - 1)
            samples.append(volume * envelope * max(-1.0, min(1.0, wave)))
            t += 1 / RATE

        n_gap = int(RATE * gap)
        for _ in range(n_gap):
            if t >= end:
                break
            samples.append(0.0)
            t += 1 / RATE

    return samples


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

# Keeper — calm, kind techno gibberish (soft syllables, warm mids)
write(
    'keeper_on',
    mix(
        tone(261.63, 0.07, 0.1, harm=0.08, attack=0.02),
        tone(392, 0.1, 0.11, harm=0.1, attack=0.015),
    ),
)
write(
    'keeper_talk',
    techno_babble(
        1.35,
        seed=42,
        base_f=310,
        spread=0.14,
        syllable_ms=70,
        gap_ms=48,
        volume=0.13,
        harsh=0.0,
        warmth=0.35,
        vibrato=0.012,
        attack=0.012,
    ),
)
write(
    'keeper_off',
    mix(
        tone(392, 0.06, 0.09, harm=0.08, attack=0.015),
        tone(261.63, 0.09, 0.08, harm=0.05, attack=0.02),
    ),
)

# Overseer — aggressive techno gibberish (clipped, harsh, higher)
write(
    'overseer_on',
    mix(
        tone(740, 0.04, 0.15, harm=0.55, attack=0.002),
        tone(987.77, 0.05, 0.13, harm=0.5, attack=0.002),
        [s * 0.35 for s in noise(0.03, 0.1)],
    ),
)
write(
    'overseer_talk',
    techno_babble(
        1.15,
        seed=99,
        base_f=620,
        spread=0.28,
        syllable_ms=38,
        gap_ms=18,
        volume=0.15,
        harsh=0.85,
        warmth=0.12,
        vibrato=0.0,
        attack=0.003,
    ),
)
write(
    'overseer_off',
    mix(
        tone(987.77, 0.04, 0.13, harm=0.55, attack=0.002),
        tone(554.37, 0.07, 0.11, harm=0.45, attack=0.004),
        [s * 0.4 for s in noise(0.04, 0.1)],
    ),
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
