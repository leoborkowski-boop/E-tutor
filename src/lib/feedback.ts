import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import type { Settings } from '../state/settings';
import { chime } from './speech';

/** Sygnał po odpowiedzi: delikatny dźwięk i/lub wibracja (wg ustawień). */
export function signal(kind: 'correct' | 'wrong' | 'tap', settings: Pick<Settings, 'sounds' | 'haptics'>) {
  if (settings.sounds && kind !== 'tap') chime(kind);
  if (!settings.haptics) return;
  try {
    if (kind === 'tap') void Haptics.impact({ style: ImpactStyle.Light });
    else void Haptics.notification({ type: kind === 'correct' ? NotificationType.Success : NotificationType.Warning });
  } catch {
    /* brak obsługi wibracji */
  }
}
