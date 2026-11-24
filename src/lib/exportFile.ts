import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/**
 * Zapis pliku tekstowego w trzech środowiskach aplikacji:
 * - strona na claude.ai: możliwość `downloads` (zwykły link do pobrania jest tam zablokowany),
 * - aplikacja Android: WebView nie pobiera plików – zapis do pamięci podręcznej i systemowe „Udostępnij”,
 * - zwykła przeglądarka: link do pobrania.
 */
export type ExportResult = 'saved' | 'shared' | 'declined' | 'failed';

type DownloadsApi = { save: (r: { filename: string; data: string }) => Promise<{ status: string }> };
type ClaudeHost = { use?: (name: string) => Promise<unknown> };

async function claudeDownloads(): Promise<DownloadsApi | null> {
  const host = (window as unknown as { claude?: ClaudeHost }).claude;
  if (!host?.use) return null;
  try {
    return (await host.use('downloads')) as DownloadsApi | null;
  } catch {
    return null;
  }
}

export async function exportTextFile(filename: string, text: string): Promise<ExportResult> {
  if (Capacitor.isNativePlatform()) {
    try {
      // Tylko folder cache/exports/ jest udostępniany innym aplikacjom (res/xml/file_paths.xml)
      const safeName = filename.replace(/[^\w.-]/g, '_');
      const { uri } = await Filesystem.writeFile({ path: `exports/${safeName}`, data: text, directory: Directory.Cache, encoding: Encoding.UTF8, recursive: true });
      await Share.share({ title: filename, files: [uri], dialogTitle: 'Zapisz lub wyślij plik z postępami' });
      return 'shared';
    } catch (e) {
      // zamknięcie okna udostępniania bez wyboru to nie błąd
      return /cancel/i.test(String((e as Error)?.message ?? e)) ? 'declined' : 'failed';
    }
  }

  const downloads = await claudeDownloads();
  if (downloads) {
    try {
      await downloads.save({ filename, data: text });
      return 'saved';
    } catch (e) {
      return (e as { code?: string })?.code === 'declined' ? 'declined' : 'failed';
    }
  }

  try {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
    return 'saved';
  } catch {
    return 'failed';
  }
}
