"""Ścieżka dźwiękowa reela EduKwadrat: muzyka w tle + efekty zgrane z animacją.
Wszystko syntetyzowane (bez cudzych nagrań – brak problemu z prawami).
Użycie: python3 promo/reel/dzwiek.py wyjscie.wav
"""
import sys
import wave
import numpy as np

SR = 44100
DUR = 25.0
N = int(SR * DUR)
rng = np.random.default_rng(7)
mix = np.zeros((N, 2))


def note(f):
    """nazwa nuty → częstotliwość, np. 'C4', 'F#3'"""
    names = {'C': -9, 'C#': -8, 'D': -7, 'D#': -6, 'E': -5, 'F': -4, 'F#': -3, 'G': -2, 'G#': -1, 'A': 0, 'A#': 1, 'B': 2}
    n, o = f[:-1], int(f[-1])
    return 440.0 * 2 ** ((names[n] + (o - 4) * 12) / 12)


def env(n, a, d, sustain=0.0, r=0.0):
    """obwiednia: atak a s, zanik wykładniczy d s"""
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / d)
    if sustain:
        e = np.maximum(e, sustain * np.minimum(1, t / max(a, 1e-4)))
    if r:
        e *= np.clip((n / SR - t) / r, 0, 1)
    return e


def add(sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= N:
        return
    sig = sig[: N - i]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    mix[i:i + len(sig), 0] += sig * gain * l * 1.414
    mix[i:i + len(sig), 1] += sig * gain * r * 1.414


def osc(f, dur, kind='sine'):
    t = np.arange(int(dur * SR)) / SR
    ph = 2 * np.pi * f * t
    if kind == 'sine':
        return np.sin(ph)
    if kind == 'tri':
        return 2 / np.pi * np.arcsin(np.sin(ph))
    if kind == 'soft':  # łagodny „pianinowy” ton: kilka harmonicznych
        return np.sin(ph) + 0.35 * np.sin(2 * ph) * np.exp(-t * 6) + 0.12 * np.sin(3 * ph) * np.exp(-t * 9)
    raise ValueError(kind)


def lowpass(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):  # krótkie sygnały – pętla wystarczy
        acc = (1 - a) * x[i] + a * acc
        y[i] = acc
    return y


def lp(x, cutoff, times=3):
    """łagodniejszy filtr: kilka filtrów jednobiegunowych po kolei"""
    for _ in range(times):
        x = lowpass(x, cutoff)
    return x


def noise(dur):
    return rng.standard_normal(int(dur * SR))


# ---------------- muzyka ----------------
BEAT = 0.6                      # 100 BPM
CHORDS = [('C', ['C4', 'E4', 'G4'], 'C3'), ('G', ['B3', 'D4', 'G4'], 'G2'),
          ('Am', ['C4', 'E4', 'A4'], 'A2'), ('F', ['C4', 'F4', 'A4'], 'F2')]
music = np.zeros((N, 2))


def madd(sig, at, gain, pan=0.0):
    i = int(at * SR)
    if i >= N:
        return
    sig = sig[: N - i]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    music[i:i + len(sig), 0] += sig * gain * l * 1.414
    music[i:i + len(sig), 1] += sig * gain * r * 1.414


bar_len = 4 * BEAT
end_music = 22.25
t0 = 0.0
k = 0
while t0 < end_music:
    _, tones, bass = CHORDS[k % 4]
    # pad: miękki akord
    for j, nn in enumerate(tones):
        s = osc(note(nn), bar_len + 0.6, 'sine') * env(int((bar_len + 0.6) * SR), 0.35, 2.5, sustain=0.6, r=0.5)
        madd(s, t0, 0.055, pan=(j - 1) * 0.3)
    # bas na 1 i 3
    for b in (0, 2):
        s = osc(note(bass), BEAT * 1.8, 'tri') * env(int(BEAT * 1.8 * SR), 0.01, 0.5)
        madd(s, t0 + b * BEAT, 0.16)
    # arpeggio ósemkami
    arp = tones + [tones[1]]
    for e8 in range(8):
        nn = arp[e8 % 4]
        f = note(nn) * (2 if e8 % 4 == 3 else 1)
        s = osc(f, 0.35, 'soft') * env(int(0.35 * SR), 0.004, 0.12)
        madd(s, t0 + e8 * BEAT / 2, 0.075, pan=0.35 if e8 % 2 else -0.35)
    t0 += bar_len
    k += 1

# perkusja: delikatna stopa i szelest
t = 0.6
while t < end_music:
    n = int(0.25 * SR)
    tt = np.arange(n) / SR
    kick = np.sin(2 * np.pi * (48 + 90 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 14)
    madd(kick, t, 0.33)
    sh = noise(0.06) * env(int(0.06 * SR), 0.002, 0.02)
    sh = lp(sh, 9000, 2) - lp(sh, 4000, 2)
    madd(sh, t + BEAT / 2, 0.06, pan=0.2)
    t += BEAT

# akord końcowy przy przycisku
for j, nn in enumerate(['C3', 'G3', 'C4', 'E4', 'G4', 'C5']):
    s = osc(note(nn), 3.0, 'soft') * env(int(3.0 * SR), 0.01, 1.4, r=0.6)
    madd(s, 22.25, 0.07, pan=(j - 2.5) * 0.15)

# ściszanie muzyki w chwili błędu (lepiej słychać efekty)
tt = np.arange(N) / SR
duck = 1 - 0.45 * np.clip((tt - 3.2) / 0.2, 0, 1) * np.clip((5.5 - tt) / 0.3, 0, 1)
music *= duck[:, None]
mix += music

# ---------------- efekty ----------------


def pop(f=880, d=0.12):
    n = int(d * SR)
    tt = np.arange(n) / SR
    att = np.minimum(1, tt / 0.003)  # bez trzasku na początku
    return np.sin(2 * np.pi * f * (1 + 0.6 * np.exp(-tt * 40)) * tt) * np.exp(-tt * 28) * att


def whoosh(d=0.45, up=True):
    x = noise(d)
    lo = lp(x, 1100) - lp(x, 180, 2)
    n = len(x)
    e = np.sin(np.linspace(0, np.pi, n)) ** 2
    return lo * e


def ding(freqs, d=1.4):
    out = np.zeros(int(d * SR))
    for i, f in enumerate(freqs):
        s = osc(f, d, 'sine') * env(int(d * SR), 0.003, 0.5 + 0.2 * i)
        out += s * (1 / (i + 1))
    return out


def scribble(d=0.5):
    x = noise(d)
    x = lp(x, 2600, 3) - lp(x, 700, 2)
    tt = np.arange(len(x)) / SR
    am = 0.55 + 0.45 * np.sin(2 * np.pi * 11 * tt) ** 2
    return x * am * np.sin(np.linspace(0, np.pi, len(x)))


def boop(f1, f2, d=0.22):
    n = int(d * SR)
    tt = np.arange(n) / SR
    f = np.linspace(f1, f2, n)
    return osc(1, d, 'sine') * 0 + np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 9)


for at, f in [(0.55, 660), (0.8, 740), (1.0, 830), (1.25, 990), (1.45, 1180)]:
    add(pop(f), at, 0.32)
add(pop(520, 0.15), 2.95, 0.3)                          # pojawia się 2/5
add(scribble(0.5), 3.3, 0.22, pan=0.2)                   # kółko długopisem
add(boop(330, 220), 3.75, 0.3, pan=0.1)                  # błąd
add(boop(260, 170, 0.3), 3.92, 0.3, pan=0.1)
add(scribble(0.35), 4.15, 0.12, pan=-0.2)                # dopisek
add(whoosh(0.55), 5.5, 0.35)                             # równanie w górę
for i in range(2):
    add(pop(300 + i * 60, 0.18), 6.15 + i * 0.18, 0.35)  # klocki wjeżdżają
for i in range(6):
    add(pop(1400 + i * 120, 0.06), 7.55 + i * 0.05, 0.16, pan=-0.5 + i * 0.2)  # podział na szóstki
for i in range(2):
    add(whoosh(0.5), 9.0 + i * 0.18, 0.22, pan=0.3)
    add(pop(700 + i * 90, 0.12), 9.85 + i * 0.18, 0.3)   # lądowanie
add(pop(900, 0.12), 10.15, 0.25)
add(ding([note('E6'), note('B6'), note('E7')], 1.6), 10.65, 0.28)        # 5/6
add(ding([note('C6'), note('E6'), note('G6'), note('C7')], 1.8), 10.95, 0.22)
for i in range(10):                                       # konfetti
    add(pop(2500 + 300 * (i % 4), 0.05), 11.2 + i * 0.06, 0.08, pan=(i % 5 - 2) / 2.5)
add(whoosh(0.4), 13.3, 0.2)
for i in range(3):                                        # karty
    add(whoosh(0.3), 13.75 + i * 0.45, 0.2, pan=-0.2)
    add(pop(500 + i * 120, 0.12), 14.05 + i * 0.45, 0.3)
for i in range(14):                                       # licznik lekcji
    add(pop(1800 + i * 40, 0.03), 15.4 + 1.2 * (1 - (1 - i / 14) ** 2), 0.07)
add(whoosh(0.5), 18.45, 0.3)                              # kalendarz
add(pop(420, 0.2), 18.95, 0.35)
# moneta: narastający połysk
n = int(1.4 * SR)
tt = np.arange(n) / SR
shimmer = np.sin(2 * np.pi * (600 + 900 * tt / 1.4) * tt) * (tt / 1.4) * np.exp(-np.maximum(0, tt - 1.2) * 12)
add(shimmer * (0.5 + 0.5 * np.sin(2 * np.pi * 18 * tt)), 20.75, 0.12)
add(ding([note('G5'), note('D6')], 1.2), 21.5, 0.18)
add(pop(880, 0.16), 22.25, 0.35)                          # przycisk
add(pop(1100, 0.12), 22.6, 0.25)
add(scribble(0.45) * 0.8, 22.85, 0.15, pan=0.3)          # zakreślacz

# ---------------- pogłos (splot z syntetyczną odpowiedzią) ----------------
ir_len = int(1.3 * SR)
ir = rng.standard_normal(ir_len) * np.exp(-np.arange(ir_len) / SR / 0.35)
ir = ir - np.convolve(ir, np.ones(8) / 8, mode='same') * 0.0
ir /= np.sqrt(np.sum(ir ** 2))
size = 1 << int(np.ceil(np.log2(N + ir_len)))
IR = np.fft.rfft(ir, size)
wet = np.stack([np.fft.irfft(np.fft.rfft(mix[:, c], size) * IR, size)[:N] for c in range(2)], axis=1)
out = mix + 0.18 * wet

# wyciszenie na końcu
fade = np.clip((DUR - tt_all) / 1.2, 0, 1) if (tt_all := np.arange(N) / SR) is not None else 1
out *= fade[:, None]
out /= np.max(np.abs(out)) * 1.12

with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((out * 32767).astype('<i2').tobytes())
print('zapisano', sys.argv[1])
