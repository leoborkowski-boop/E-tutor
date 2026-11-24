"""Spokojna ścieżka do reela dla rodziców: ciepłe akordy, fortepian, delikatne efekty.
Wszystko syntetyzowane. Użycie: python3 promo/reel/dzwiek-rodzice.py wyjscie.wav
"""
import sys
import wave
import numpy as np

SR = 44100
DUR = 25.0
N = int(SR * DUR)
rng = np.random.default_rng(11)
mix = np.zeros((N, 2))
TT = np.arange(N) / SR


def hz(n):
    names = {'C': -9, 'C#': -8, 'D': -7, 'D#': -6, 'E': -5, 'F': -4, 'F#': -3, 'G': -2, 'G#': -1, 'A': 0, 'A#': 1, 'B': 2}
    return 440.0 * 2 ** ((names[n[:-1]] + (int(n[-1]) - 4) * 12) / 12)


def add(sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= N:
        return
    sig = sig[: N - i]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    mix[i:i + len(sig), 0] += sig * gain * l * 1.414
    mix[i:i + len(sig), 1] += sig * gain * r * 1.414


def tvec(d):
    return np.arange(int(d * SR)) / SR


def lowpass(x, cutoff, times=2):
    a = np.exp(-2 * np.pi * cutoff / SR)
    for _ in range(times):
        y = np.empty_like(x)
        acc = 0.0
        for i in range(len(x)):
            acc = (1 - a) * x[i] + a * acc
            y[i] = acc
        x = y
    return x


def pad(f, d):
    """ciepły pad: kilka lekko rozstrojonych sinusów, wolny atak i zanik"""
    t = tvec(d)
    s = sum(np.sin(2 * np.pi * f * (1 + det) * t + ph) for det, ph in [(-0.003, 0), (0, 1.1), (0.003, 2.3)]) / 3
    s += 0.25 * np.sin(2 * np.pi * 2 * f * t)
    e = np.minimum(1, t / 0.9) * np.clip((d - t) / 1.0, 0, 1)
    return s * e


def piano(f, d=2.2):
    t = tvec(d)
    s = np.sin(2 * np.pi * f * t) + 0.45 * np.sin(4 * np.pi * f * t) * np.exp(-t * 3) + 0.15 * np.sin(6 * np.pi * f * t) * np.exp(-t * 5)
    return s * np.minimum(1, t / 0.006) * np.exp(-t * 1.6)


def tick(f=2400, d=0.05):
    t = tvec(d)
    return np.sin(2 * np.pi * f * t) * np.minimum(1, t / 0.002) * np.exp(-t * 90)


def chime(notes, d=2.5):
    t = tvec(d)
    out = np.zeros(len(t))
    for i, n in enumerate(notes):
        f = hz(n)
        out += (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2.76 * f * t) * np.exp(-t * 4)) * np.exp(-t * (1.2 + 0.3 * i)) * np.minimum(1, t / 0.004)
    return out / len(notes)


def whoosh(d=0.9):
    x = rng.standard_normal(int(d * SR))
    x = lowpass(x, 900, 3) - lowpass(x, 150, 2)
    return x * np.sin(np.linspace(0, np.pi, len(x))) ** 3


# ---------- muzyka: 72 BPM, akordy Fmaj7 – Am7 – Dm9 – G6/9 ----------
BEAT = 60 / 72
BAR = 4 * BEAT
CH = [
    (['F3', 'A3', 'C4', 'E4'], 'F2', ['C5', 'A4', 'E5', 'A4']),
    (['A3', 'C4', 'E4', 'G4'], 'A2', ['E5', 'C5', 'G5', 'C5']),
    (['D3', 'F3', 'A3', 'E4'], 'D2', ['A4', 'F4', 'E5', 'F4']),
    (['G3', 'B3', 'D4', 'A4'], 'G2', ['D5', 'B4', 'A5', 'B4']),
]
t0, k = 0.0, 0
while t0 < 22.1:
    ch, bass, mel = CH[k % 4]
    for j, n in enumerate(ch):
        add(pad(hz(n), BAR + 1.0), t0, 0.05, pan=(j - 1.5) * 0.25)
    add(pad(hz(bass), BAR + 0.8), t0, 0.12)
    for q in range(4):  # fortepian ćwierćnutami (pomijamy pierwszy takt – wolny początek)
        if k == 0 and q < 2:
            continue
        add(piano(hz(mel[q])), t0 + q * BEAT, 0.07, pan=0.25 if q % 2 else -0.25)
    t0 += BAR
    k += 1

# rozwiązanie na końcu: Cmaj9
for j, n in enumerate(['C3', 'G3', 'B3', 'D4', 'E4', 'G4']):
    add(pad(hz(n), 3.4), 22.0, 0.06, pan=(j - 2.5) * 0.18)
for j, n in enumerate(['G4', 'B4', 'D5', 'E5']):
    add(piano(hz(n), 3.0), 22.1 + j * 0.09, 0.06, pan=(j - 1.5) * 0.3)

# ---------- efekty ----------
t = tvec(0.5)
add(np.sin(2 * np.pi * 70 * t) * np.exp(-t * 7) * np.minimum(1, t / 0.01), 0.5, 0.35)   # data – miękkie uderzenie
for at in (4.35, 10.15, 15.35, 20.15):
    add(whoosh(), at, 0.22)
for i in range(6):                                          # paski postępów
    add(tick(2200 + i * 140), 5.55 + i * 0.16, 0.07, pan=-0.3 + i * 0.12)
add(chime(['E6', 'A6']), 7.3, 0.12)                         # etykiety „opanowany / do powtórki”
for i in range(3):                                          # kroki
    add(tick(1500 + i * 200, 0.08), 11.0 + i * 0.4, 0.12)
add(tick(1300, 0.08), 16.25, 0.12)                          # karty z ceną
add(chime(['A5', 'E6', 'A6']), 16.8, 0.13)
t = tvec(1.6)                                               # moneta z logo
shim = np.sin(2 * np.pi * (900 + 500 * t / 1.6) * t) * (t / 1.6) * np.exp(-np.maximum(0, t - 1.3) * 10)
add(shim, 20.45, 0.05)
add(chime(['C6', 'G6', 'E7']), 21.35, 0.1)

# ---------- pogłos ----------
ir_len = int(2.2 * SR)
ir = rng.standard_normal(ir_len) * np.exp(-np.arange(ir_len) / SR / 0.6)
ir /= np.sqrt(np.sum(ir ** 2))
size = 1 << int(np.ceil(np.log2(N + ir_len)))
IR = np.fft.rfft(ir, size)
wet = np.stack([np.fft.irfft(np.fft.rfft(mix[:, c], size) * IR, size)[:N] for c in range(2)], axis=1)
out = mix + 0.28 * wet
out *= np.clip((DUR - TT) / 1.5, 0, 1)[:, None]
out /= np.max(np.abs(out)) * 1.12
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((out * 32767).astype('<i2').tobytes())
print('zapisano', sys.argv[1])
