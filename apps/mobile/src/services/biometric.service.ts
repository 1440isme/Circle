import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import { getItem, setItem } from './storage';

const BIOMETRIC_ENABLED_KEY = 'circle_biometric_enabled';

export interface BiometricStatus {
  hasHardware: boolean;
  isEnrolled: boolean;
  isAvailable: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
}

/**
 * Check if the device hardware supports biometrics and has enrolled prints/faces.
 */
export async function checkBiometricStatus(): Promise<BiometricStatus> {
  if (Platform.OS === 'web') {
    return {
      hasHardware: false,
      isEnrolled: false,
      isAvailable: false,
      supportedTypes: [],
    };
  }

  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

    return {
      hasHardware,
      isEnrolled,
      isAvailable: hasHardware && isEnrolled,
      supportedTypes,
    };
  } catch {
    return {
      hasHardware: false,
      isEnrolled: false,
      isAvailable: false,
      supportedTypes: [],
    };
  }
}

/**
 * Check if user has toggled biometric unlock on in application preferences.
 */
export async function isBiometricUnlockEnabled(): Promise<boolean> {
  try {
    const val = await getItem(BIOMETRIC_ENABLED_KEY);
    return val === 'true';
  } catch {
    return false;
  }
}

/**
 * Enable or disable biometric quick unlock.
 */
export async function setBiometricUnlockEnabled(enabled: boolean): Promise<void> {
  await setItem(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false');
}

/**
 * Trigger biometric authentication prompt (Face ID / Touch ID / Biometric Prompt).
 */
export async function authenticateWithBiometrics(
  promptMessage: string = 'CIRCLE — Xác thực sinh trắc học',
): Promise<boolean> {
  if (Platform.OS === 'web') {
    return true;
  }

  try {
    const status = await checkBiometricStatus();
    if (!status.isAvailable) {
      return false;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Hủy',
      disableDeviceFallback: false,
      fallbackLabel: 'Nhập mật khẩu',
    });

    return result.success;
  } catch {
    return false;
  }
}
