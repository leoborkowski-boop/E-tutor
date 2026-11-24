import { useState, type FormEvent } from 'react';
import { Button, Card, Segmented } from '../components/ui';
import { siteUrl } from '../lib/account';
import { useAccount } from '../state/AccountState';

type Mode = 'login' | 'register' | 'forgot';

function Message({ kind, children }: { kind: 'ok' | 'err'; children: string }) {
  return (
    <div className={`feedback ${kind === 'ok' ? 'feedback-correct' : 'feedback-wrong'}`} role={kind === 'err' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}

function LoggedOut() {
  const acc = useAccount();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setInfo(null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === 'login') {
        const r = await acc.login(email, password);
        if (!r.ok) setError(r.blad);
        else setPassword('');
      } else if (mode === 'register') {
        const r = await acc.register(email, password, consent);
        if (!r.ok) setError(r.blad);
        else {
          setInfo(r.wiadomosc + ' Po potwierdzeniu adresu możesz się zalogować tym samym hasłem.');
          setPassword('');
          setMode('login');
        }
      } else {
        const r = await acc.forgot(email);
        if (!r.ok) setError(r.blad);
        else setInfo(r.wiadomosc);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <Segmented
        label="Logowanie lub rejestracja"
        value={mode === 'register' ? 'register' : 'login'}
        onChange={(v) => switchMode(v)}
        options={[
          { value: 'login', label: 'Zaloguj się' },
          { value: 'register', label: 'Załóż konto' },
        ]}
      />
      <form className="ai-form" onSubmit={submit} style={{ marginTop: 16 }} noValidate>
        {mode === 'forgot' && <p className="muted">Podaj adres e-mail konta. Wyślemy link do ustawienia nowego hasła.</p>}
        <div className="field">
          <label htmlFor="acc-email">Adres e-mail</label>
          <input id="acc-email" type="email" inputMode="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={busy} />
        </div>
        {mode !== 'forgot' && (
          <div className="field">
            <label htmlFor="acc-pass">Hasło</label>
            <input
              id="acc-pass"
              type="password"
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
            />
            {mode === 'register' && <span className="muted small">Co najmniej 8 znaków. Konto zakłada rodzic lub opiekun (osoba pełnoletnia).</span>}
          </div>
        )}
        {mode === 'register' && (
          <label className="consent-check">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} disabled={busy} />
            <span>
              Mam ukończone 18 lat i akceptuję{' '}
              <a href={siteUrl('regulamin.html')} target="_blank" rel="noopener noreferrer">
                regulamin
              </a>{' '}
              oraz{' '}
              <a href={siteUrl('polityka-prywatnosci.html')} target="_blank" rel="noopener noreferrer">
                politykę prywatności
              </a>
              .
            </span>
          </label>
        )}
        {error && <Message kind="err">{error}</Message>}
        {info && <Message kind="ok">{info}</Message>}
        <div className="actions">
          <Button type="submit" variant="primary" disabled={busy}>
            {busy ? 'Chwileczkę…' : mode === 'login' ? 'Zaloguj się' : mode === 'register' ? 'Załóż konto' : 'Wyślij link'}
          </Button>
          {mode === 'forgot' ? (
            <Button variant="quiet" onClick={() => switchMode('login')}>
              Wróć do logowania
            </Button>
          ) : (
            mode === 'login' && (
              <Button variant="quiet" onClick={() => switchMode('forgot')}>
                Nie pamiętam hasła
              </Button>
            )
          )}
        </div>
      </form>
    </Card>
  );
}

function LoggedIn() {
  const acc = useAccount();
  const s = acc.session!;
  type Msg = { kind: 'ok' | 'err'; text: string } | null;
  // komunikaty pokazujemy w tej karcie, w której użytkownik coś zrobił
  const [msgAcc, setMsgAcc] = useState<Msg>(null);
  const [msgPw, setMsgPw] = useState<Msg>(null);
  const [msgDel, setMsgDel] = useState<Msg>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<'password' | 'delete' | null>(null);
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [delPw, setDelPw] = useState('');
  const [confirmWipe, setConfirmWipe] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setMsgAcc(null);
    setMsgPw(null);
    setMsgDel(null);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  const status =
    acc.sync === 'syncing'
      ? 'Synchronizuję postępy…'
      : acc.sync === 'error'
        ? (acc.syncMessage ?? 'Synchronizacja nie udała się.')
        : acc.lastSync
          ? `Postępy zsynchronizowane o ${new Date(acc.lastSync).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}.`
          : 'Postępy są zapisywane na koncie automatycznie.';

  return (
    <>
      <Card>
        <h2>Twoje konto</h2>
        <p>
          <strong>{s.email}</strong>
        </p>
        {s.verified ? (
          <p className="muted small">Adres e-mail potwierdzony.</p>
        ) : (
          <div className="feedback feedback-info" role="status">
            <p style={{ margin: 0 }}>Adres e-mail nie jest jeszcze potwierdzony. Otwórz wiadomość od EduKwadrat (sprawdź też spam), wpisz hasło konta i kliknij „Potwierdzam”.</p>
            <div className="actions" style={{ marginTop: 10 }}>
              <Button
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    const r = await acc.resend();
                    setMsgAcc(r.ok ? { kind: 'ok', text: r.wiadomosc } : { kind: 'err', text: r.blad });
                  })
                }
              >
                Wyślij e-mail ponownie
              </Button>
            </div>
          </div>
        )}
        {s.access.length > 0 && (
          <p className="muted small">Dostęp do wszystkich działów ważny do {new Date(Math.max(...s.access.map((a) => a.do)) * 1000).toLocaleDateString('pl-PL')}.</p>
        )}
        <p className="muted small" aria-live="polite">
          {status}
        </p>
        <div className="actions">
          <Button icon="refresh" disabled={acc.sync === 'syncing'} onClick={() => void acc.syncNow()}>
            Synchronizuj teraz
          </Button>
        </div>
        {msgAcc && <Message kind={msgAcc.kind}>{msgAcc.text}</Message>}
      </Card>

      <Card>
        <h2>Bezpieczeństwo</h2>
        {open === 'password' ? (
          <form
            className="ai-form"
            onSubmit={(e) => {
              e.preventDefault();
              void run(async () => {
                const r = await acc.changePassword(oldPw, newPw);
                if (r.ok) {
                  setMsgPw({ kind: 'ok', text: 'Hasło zmienione. Na innych urządzeniach zalogujesz się nowym hasłem.' });
                  setOpen(null);
                  setOldPw('');
                  setNewPw('');
                } else setMsgPw({ kind: 'err', text: r.blad });
              });
            }}
          >
            <div className="field">
              <label htmlFor="pw-old">Obecne hasło</label>
              <input id="pw-old" type="password" autoComplete="current-password" required value={oldPw} onChange={(e) => setOldPw(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="pw-new">Nowe hasło (co najmniej 8 znaków)</label>
              <input id="pw-new" type="password" autoComplete="new-password" minLength={8} required value={newPw} onChange={(e) => setNewPw(e.target.value)} />
            </div>
            <div className="actions">
              <Button type="submit" variant="primary" disabled={busy}>
                Zmień hasło
              </Button>
              <Button variant="quiet" onClick={() => setOpen(null)}>
                Anuluj
              </Button>
            </div>
          </form>
        ) : (
          <div className="actions">
            <Button onClick={() => setOpen('password')}>Zmień hasło</Button>
          </div>
        )}
        {msgPw && <Message kind={msgPw.kind}>{msgPw.text}</Message>}
      </Card>

      <Card>
        <h2>Wylogowanie</h2>
        <p className="muted small">
          Po wylogowaniu postępy zostają na tym urządzeniu. Jeśli ktoś inny ma z niego korzystać, wyloguj się z usunięciem postępów – na koncie nic nie zniknie.
        </p>
        <div className="actions">
          <Button disabled={busy} onClick={() => run(() => acc.logout(false))}>
            Wyloguj
          </Button>
          {confirmWipe ? (
            <>
              <Button variant="primary" disabled={busy} onClick={() => run(() => acc.logout(true))}>
                Tak, wyloguj i usuń z tego urządzenia
              </Button>
              <Button variant="quiet" onClick={() => setConfirmWipe(false)}>
                Anuluj
              </Button>
            </>
          ) : (
            <Button variant="quiet" onClick={() => setConfirmWipe(true)}>
              Wyloguj i usuń postępy z urządzenia
            </Button>
          )}
        </div>
      </Card>

      <Card>
        <h2>Usuwanie konta</h2>
        <p className="muted small">Usuwa konto razem z zapisanymi na nim postępami. Tego nie da się cofnąć. Postępy zapisane na tym urządzeniu zostają.</p>
        {open === 'delete' ? (
          <form
            className="ai-form"
            onSubmit={(e) => {
              e.preventDefault();
              void run(async () => {
                const r = await acc.deleteAccount(delPw);
                if (!r.ok) setMsgDel({ kind: 'err', text: r.blad });
              });
            }}
          >
            <div className="field">
              <label htmlFor="del-pw">Wpisz hasło, żeby potwierdzić</label>
              <input id="del-pw" type="password" autoComplete="current-password" required value={delPw} onChange={(e) => setDelPw(e.target.value)} />
            </div>
            <div className="actions">
              <Button type="submit" variant="primary" disabled={busy}>
                Usuń konto na stałe
              </Button>
              <Button variant="quiet" onClick={() => setOpen(null)}>
                Anuluj
              </Button>
            </div>
          </form>
        ) : (
          <div className="actions">
            <Button variant="quiet" icon="trash" onClick={() => setOpen('delete')}>
              Usuń konto
            </Button>
          </div>
        )}
        {msgDel && <Message kind={msgDel.kind}>{msgDel.text}</Message>}
      </Card>
    </>
  );
}

export function AccountScreen() {
  const acc = useAccount();
  return (
    <div className="page">
      <header className="page-head">
        <h1>Konto</h1>
        <p className="lead">Z kontem postępy są bezpieczne i dostępne na każdym urządzeniu. Aplikacja działa też bez konta.</p>
      </header>
      {!acc.available ? (
        <Card>
          <p>Konta będą dostępne po starcie pełnej wersji. Do tego czasu postępy zapisują się na tym urządzeniu.</p>
        </Card>
      ) : acc.session ? (
        <LoggedIn />
      ) : (
        <>
          {acc.notice && <Message kind="err">{acc.notice}</Message>}
          <LoggedOut />
        </>
      )}
    </div>
  );
}
