/**
 * Dostęp do działów: ułamki są darmowe dla wszystkich, pozostałe działy wymagają
 * pełnej wersji (konto z aktywnym dostępem, przyznawanym po zakupie).
 */
import { Button, Card } from '../components/ui';
import { siteUrl } from '../lib/account';
import { href } from '../router';
import { useAccount } from './AccountState';

export const FREE_ZONES = ['ulamki'];

/** Czy zalogowane konto ma aktywny dostęp do pełnej wersji. */
export function useFullAccess(): boolean {
  const { session } = useAccount();
  return Boolean(session?.access.some((a) => a.do * 1000 > Date.now()));
}

export function zoneLocked(zoneId: string, fullAccess: boolean): boolean {
  return !fullAccess && !FREE_ZONES.includes(zoneId);
}

export function Paywall({ title }: { title: string }) {
  const { session, available } = useAccount();
  return (
    <div className="page">
      <a className="back-link" href={href.lessons}>
        ← Wszystkie działy
      </a>
      <header className="page-head">
        <p className="eyebrow">Pełna wersja</p>
        <h1>{title}</h1>
        <p className="lead">Ten dział jest częścią pełnej wersji EduKwadrat. Ułamki są dostępne za darmo.</p>
      </header>
      <Card>
        <p>Pełna wersja obejmuje wszystkie 10 działów egzaminu ósmoklasisty. Cenę przedsprzedażową można zarezerwować na stronie EduKwadrat.</p>
        <div className="actions">
          <Button variant="primary" href={siteUrl('index.html#cena')}>
            Zarezerwuj cenę
          </Button>
          <Button href={href.zone('ulamki')}>Ćwicz ułamki za darmo</Button>
          {available && !session && <Button variant="quiet" href={href.account}>Mam już dostęp – zaloguj się</Button>}
        </div>
      </Card>
    </div>
  );
}
