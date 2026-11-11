import { Clipboard, Platform, Share } from 'react-native';

/**
 * Safely copies text to the system clipboard across iOS, Android, and Web,
 * falling back to native Share sheet if native Clipboard is unavailable.
 */
export async function copyTextSafe(text: string): Promise<boolean> {
  if (!text) return false;
  try {
    if (
      Platform.OS === 'web' &&
      typeof navigator !== 'undefined' &&
      navigator.clipboard?.writeText
    ) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const rnClipboard = Clipboard as unknown as { setString?: (val: string) => void } | undefined;
    if (rnClipboard && typeof rnClipboard.setString === 'function') {
      rnClipboard.setString(text);
      return true;
    }
    await Share.share({ message: text });
    return true;
  } catch {
    return false;
  }
}
