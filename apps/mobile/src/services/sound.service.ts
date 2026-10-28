import * as Haptics from 'expo-haptics';
import { useMobileSoundStore } from '../stores/sound.store';

/**
 * Triggers a subtle tactile haptic tap for message sent or light user action.
 */
export function triggerSendHaptic(): void {
  if (!useMobileSoundStore.getState().hapticsEnabled) return;
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {}
}

/**
 * Triggers a selection tick when tapping reactions, toggling options or switching tabs.
 */
export function triggerSelectionHaptic(): void {
  if (!useMobileSoundStore.getState().hapticsEnabled) return;
  try {
    Haptics.selectionAsync();
  } catch {}
}

/**
 * Triggers a medium tactile impact when initiating or answering calls.
 */
export function triggerMediumHaptic(): void {
  if (!useMobileSoundStore.getState().hapticsEnabled) return;
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {}
}

/**
 * Triggers a success notification feedback.
 */
export function triggerSuccessHaptic(): void {
  if (!useMobileSoundStore.getState().hapticsEnabled) return;
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {}
}

/**
 * Triggers a warning/error notification feedback.
 */
export function triggerWarningHaptic(): void {
  if (!useMobileSoundStore.getState().hapticsEnabled) return;
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch {}
}
