import { useRef, useState, type ReactNode } from 'react';
import { Button, Card, Segmented, Slider, Toggle } from '../components/ui';
import { speak, speechSupported, useVoices } from '../lib/speech';
import { useApp } from '../state/AppState';
import type { Progress } from '../state/progress';
import { PRESETS } from '../state/settings';

function Row({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div className="setting-row">
      <div className="setting-text">
        <span className="setting-title">{title}</span>
        {hint && <span className="muted small">{hint}</span>}
      </div>
      <div className="setting-control">{children}</div>
    </div>
  );
}

export function SettingsScreen() {
  const { settings: s, updateSettings: set, resetSettings, progress, resetProgress, importProgress } = useApp();
  const voices = useVoices();
  const [confirmReset, setConfirmReset] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const exportProgress = () => {
    const blob = new Blob([JSON.stringify({ app: 'e-tutor', version: 1, progress, settings: s }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `e-tutor-postepy-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const onImport = async (f: File) => {
    try {
      const data = JSON.parse(await f.text()) as { progress?: Progress };
      if (!data.progress || !Array.isArray(data.progress.attempts)) throw new Error();
      importProgress(data.progress);
      setMsg('Postępy zostały wczytane.');
    } catch {
      setMsg('Nie udało się wczytać pliku – sprawdź, czy to plik eksportu z E-tutora.');
    }
  };

  return (
    <div className="page settings">
      <header className="page-head">
        <h1>Ustawienia</h1>
        <p className="lead">Dopasuj tempo, pomoc, głos i wygląd do siebie. Zmiany zapisują się od razu.</p>
      </header>

      <Card>
        <h2>Szybki wybór</h2>
        <div className="presets">
          {PRESETS.map((p) => (
            <button key={p.id} type="button" className="preset" onClick={() => set(p.values)}>
              <strong>{p.name}</strong>
              <span className="muted small">{p.description}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h2>Tempo nauki</h2>
        <Row title="Liczba zadań w sesji">
          <Segmented label="Liczba zadań" value={s.sessionLength} onChange={(v) => set({ sessionLength: v })} options={[5, 10, 15, 20].map((n) => ({ value: n, label: String(n) }))} />
        </Row>
        <Row title="Poziom trudności" hint="Automatyczny dobiera poziom do Twoich wyników w danym dziale.">
          <Segmented
            label="Poziom trudności"
            value={s.difficulty}
            onChange={(v) => set({ difficulty: v })}
            options={[
              { value: 'auto', label: 'Auto' },
              { value: 1, label: 'Łatwy' },
              { value: 2, label: 'Średni' },
              { value: 3, label: 'Trudny' },
            ]}
          />
        </Row>
        <Row title="Czas w zadaniach" hint="Odliczanie jest tylko informacją – po upływie czasu możesz spokojnie dokończyć.">
          <Segmented
            label="Czas w zadaniach"
            value={s.timerMode}
            onChange={(v) => set({ timerMode: v })}
            options={[
              { value: 'off', label: 'Bez zegara' },
              { value: 'stopwatch', label: 'Stoper' },
              { value: 'countdown', label: 'Odliczanie' },
            ]}
          />
        </Row>
        {s.timerMode === 'countdown' && (
          <Row title="Czas na jedno zadanie">
            <Slider label="Czas na zadanie" value={s.taskSeconds} min={30} max={300} step={30} onChange={(v) => set({ taskSeconds: v })} format={(v) => `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')} min`} />
          </Row>
        )}
        <Row title="Czas na próbny arkusz">
          <Segmented
            label="Czas na arkusz"
            value={s.examMinutes}
            onChange={(v) => set({ examMinutes: v })}
            options={[
              { value: 30, label: '30 min' },
              { value: 45, label: '45 min' },
              { value: 60, label: '60 min' },
              { value: 0, label: 'Bez limitu' },
            ]}
          />
        </Row>
      </Card>

      <Card>
        <h2>Pomoc w zadaniach</h2>
        <Row title="Podpowiedzi">
          <Segmented
            label="Podpowiedzi"
            value={s.hintsMode}
            onChange={(v) => set({ hintsMode: v })}
            options={[
              { value: 'always', label: 'Zawsze' },
              { value: 'afterError', label: 'Po błędzie' },
              { value: 'off', label: 'Wyłączone' },
            ]}
          />
        </Row>
        <Row title="Liczba prób" hint="Ile razy można odpowiedzieć, zanim pokażemy rozwiązanie.">
          <Segmented label="Liczba prób" value={s.maxAttempts} onChange={(v) => set({ maxAttempts: v })} options={[1, 2, 3].map((n) => ({ value: n, label: String(n) }))} />
        </Row>
        <Row title="Szczegółowość rozwiązań">
          <Segmented
            label="Szczegółowość rozwiązań"
            value={s.solutionDetail}
            onChange={(v) => set({ solutionDetail: v })}
            options={[
              { value: 'short', label: 'Krótko' },
              { value: 'full', label: 'Krok po kroku' },
            ]}
          />
        </Row>
        <Row title="Pokazuj rozwiązanie także po dobrej odpowiedzi">
          <Toggle label="Rozwiązanie po dobrej odpowiedzi" checked={s.showSolutionAfterCorrect} onChange={(v) => set({ showSolutionAfterCorrect: v })} />
        </Row>
        <Row title="Tryb „krok po kroku”" hint="Prowadzi przez zadanie małymi krokami. Obniża nieco wynik zadania.">
          <Toggle label="Tryb krok po kroku" checked={s.stepModeAvailable} onChange={(v) => set({ stepModeAvailable: v })} />
        </Row>
        <Row title="Rysunki (paski, oś liczbowa)">
          <Toggle label="Rysunki" checked={s.showVisuals} onChange={(v) => set({ showVisuals: v })} />
        </Row>
      </Card>

      <Card>
        <h2>Głos lektora</h2>
        {!speechSupported && <p className="feedback feedback-info">Ta przeglądarka nie obsługuje czytania na głos.</p>}
        <Row title="Czytanie na głos" hint="Przy tekstach pojawi się przycisk głośnika.">
          <Toggle label="Czytanie na głos" checked={s.voiceEnabled} onChange={(v) => set({ voiceEnabled: v })} />
        </Row>
        {s.voiceEnabled && (
          <>
            <Row title="Czytaj zadania automatycznie">
              <Toggle label="Automatyczne czytanie" checked={s.autoRead} onChange={(v) => set({ autoRead: v })} />
            </Row>
            <Row title="Czytaj komunikaty po sprawdzeniu">
              <Toggle label="Czytanie komunikatów" checked={s.readFeedback} onChange={(v) => set({ readFeedback: v })} />
            </Row>
            <Row title="Głos" hint={voices.length ? undefined : 'Nie znaleziono polskich głosów w systemie – zostanie użyty domyślny.'}>
              <select className="select" value={s.voiceURI ?? ''} onChange={(e) => set({ voiceURI: e.target.value || null })} aria-label="Wybór głosu">
                <option value="">Domyślny polski</option>
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name}
                  </option>
                ))}
              </select>
            </Row>
            <Row title="Tempo mowy">
              <Slider label="Tempo mowy" value={s.rate} min={0.5} max={1.5} step={0.05} onChange={(v) => set({ rate: v })} format={(v) => `${v.toFixed(2)}×`} />
            </Row>
            <Row title="Wysokość głosu">
              <Slider label="Wysokość głosu" value={s.pitch} min={0.5} max={1.5} step={0.05} onChange={(v) => set({ pitch: v })} format={(v) => v.toFixed(2)} />
            </Row>
            <Row title="Głośność">
              <Slider label="Głośność" value={s.volume} min={0.1} max={1} step={0.1} onChange={(v) => set({ volume: v })} format={(v) => `${Math.round(v * 100)}%`} />
            </Row>
            <div className="actions">
              <Button icon="speaker" onClick={() => speak('Cześć! Policzmy razem: {1/2} + {1/4} = {3/4}.', s)}>
                Posłuchaj próbki
              </Button>
            </div>
          </>
        )}
      </Card>

      <Card>
        <h2>Wygląd i dostępność</h2>
        <Row title="Motyw">
          <Segmented
            label="Motyw"
            value={s.theme}
            onChange={(v) => set({ theme: v })}
            options={[
              { value: 'system', label: 'Systemowy' },
              { value: 'light', label: 'Jasny' },
              { value: 'dark', label: 'Ciemny' },
            ]}
          />
        </Row>
        <Row title="Rozmiar tekstu">
          <Slider label="Rozmiar tekstu" value={s.fontScale} min={0.9} max={1.5} step={0.05} onChange={(v) => set({ fontScale: v })} format={(v) => `${Math.round(v * 100)}%`} />
        </Row>
        <Row title="Wysoki kontrast">
          <Toggle label="Wysoki kontrast" checked={s.highContrast} onChange={(v) => set({ highContrast: v })} />
        </Row>
        <Row title="Czcionka dla osób z dysleksją" hint="OpenDyslexic – litery o wyraźniejszych kształtach.">
          <Toggle label="Czcionka dla dyslektyków" checked={s.dyslexiaFont} onChange={(v) => set({ dyslexiaFont: v })} />
        </Row>
        <Row title="Większe odstępy w tekście">
          <Toggle label="Większe odstępy" checked={s.wideSpacing} onChange={(v) => set({ wideSpacing: v })} />
        </Row>
        <Row title="Ogranicz animacje">
          <Toggle label="Ogranicz animacje" checked={s.reduceMotion} onChange={(v) => set({ reduceMotion: v })} />
        </Row>
        <Row title="Delikatne dźwięki po odpowiedzi">
          <Toggle label="Dźwięki" checked={s.sounds} onChange={(v) => set({ sounds: v })} />
        </Row>
        <Row title="Wibracje" hint="Lekka wibracja po odpowiedzi i przy dotykaniu przycisków (na telefonie).">
          <Toggle label="Wibracje" checked={s.haptics} onChange={(v) => set({ haptics: v })} />
        </Row>
        <Row title="Klawiatura ułamków na ekranie" hint="Przyciski z „/”, spacją i przecinkiem. Automatycznie – na telefonach i tabletach.">
          <Segmented
            label="Klawiatura ułamków"
            value={s.keypad}
            onChange={(v) => set({ keypad: v })}
            options={[
              { value: 'auto', label: 'Auto' },
              { value: 'on', label: 'Zawsze' },
              { value: 'off', label: 'Nigdy' },
            ]}
          />
        </Row>
      </Card>

      <Card>
        <h2>Motywacja</h2>
        <Row title="Dzienny cel nauki">
          <Segmented
            label="Dzienny cel"
            value={s.dailyGoalMinutes}
            onChange={(v) => set({ dailyGoalMinutes: v })}
            options={[
              { value: 0, label: 'Wył.' },
              { value: 5, label: '5 min' },
              { value: 10, label: '10 min' },
              { value: 20, label: '20 min' },
              { value: 30, label: '30 min' },
            ]}
          />
        </Row>
        <Row title="Odznaki">
          <Toggle label="Odznaki" checked={s.showBadges} onChange={(v) => set({ showBadges: v })} />
        </Row>
        <Row title="Kalendarz nauki">
          <Toggle label="Kalendarz nauki" checked={s.showCalendar} onChange={(v) => set({ showCalendar: v })} />
        </Row>
      </Card>

      <Card>
        <h2>Dane</h2>
        <p className="muted small">Postępy są zapisane tylko w tej przeglądarce. Możesz je wyeksportować i wczytać na innym urządzeniu.</p>
        <div className="actions">
          <Button onClick={exportProgress}>Eksportuj postępy</Button>
          <Button onClick={() => fileRef.current?.click()}>Wczytaj postępy</Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onImport(f);
              e.target.value = '';
            }}
          />
          <Button variant="ghost" onClick={resetSettings}>
            Przywróć domyślne ustawienia
          </Button>
          {!confirmReset ? (
            <Button variant="quiet" onClick={() => setConfirmReset(true)}>
              Wyczyść postępy…
            </Button>
          ) : (
            <>
              <Button
                variant="primary"
                onClick={() => {
                  resetProgress();
                  setConfirmReset(false);
                  setMsg('Postępy zostały wyczyszczone.');
                }}
              >
                Tak, wyczyść wszystko
              </Button>
              <Button variant="ghost" onClick={() => setConfirmReset(false)}>
                Anuluj
              </Button>
            </>
          )}
        </div>
        {msg && <p className="feedback feedback-info">{msg}</p>}
      </Card>
    </div>
  );
}
