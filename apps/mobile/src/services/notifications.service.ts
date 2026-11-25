import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { mobileApiRequest } from './api';
import { NotificationEntity, DevicePlatform } from '@circle/types';

// Configure foreground notification behavior (NOT-03: display banner/badge softly without sound lock)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const DEVICE_ID_KEY = 'circle_mobile_device_id';

/**
 * Retrieve or generate a persistent unique device ID
 */
export async function getDeviceId(): Promise<string> {
  try {
    const stored = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    if (stored) {
      return stored;
    }
    const generated =
      Device.osBuildId ||
      Constants.installationId ||
      `device-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    await SecureStore.setItemAsync(DEVICE_ID_KEY, generated);
    return generated;
  } catch {
    return `device-fallback-${Date.now()}`;
  }
}

/**
 * REST API: Fetch paginated notifications
 */
export async function getNotificationsApi(cursor?: string | null, unreadOnly = false) {
  const params = new URLSearchParams();
  params.set('limit', '20');
  if (cursor) params.set('cursor', cursor);
  if (unreadOnly) params.set('unreadOnly', 'true');

  return mobileApiRequest<NotificationEntity[]>(`/notifications?${params.toString()}`);
}

/**
 * REST API: Get server unread count
 */
export async function getUnreadCountApi() {
  return mobileApiRequest<{ unreadCount: number }>('/notifications/unread-count');
}

/**
 * REST API: Mark notification as read
 */
export async function markNotificationAsReadApi(id: string) {
  return mobileApiRequest<NotificationEntity>(`/notifications/${id}/read`, {
    method: 'PATCH',
  });
}

/**
 * REST API: Mark all notifications as read
 */
export async function markAllNotificationsAsReadApi() {
  return mobileApiRequest<{ updatedCount: number }>('/notifications/read-all', {
    method: 'POST',
  });
}

/**
 * REST API: Delete notification
 */
export async function deleteNotificationApi(id: string) {
  return mobileApiRequest<{ success: boolean }>(`/notifications/${id}`, {
    method: 'DELETE',
  });
}

/**
 * REST API: Register device push token with backend (NOT-09)
 */
export async function registerPushTokenApi(token: string, deviceId: string) {
  const platform: DevicePlatform = Platform.OS === 'ios' ? 'IOS' : 'ANDROID';
  return mobileApiRequest('/devices/push-token', {
    method: 'POST',
    body: JSON.stringify({
      token,
      deviceId,
      platform,
    }),
  });
}

/**
 * REST API: Revoke device push token on logout (NOT-09)
 */
export async function revokePushTokenApi(deviceId: string) {
  return mobileApiRequest('/devices/push-token', {
    method: 'DELETE',
    body: JSON.stringify({
      deviceId,
    }),
  });
}

/**
 * Initialize Push Notifications on mobile device
 */
export async function initPushNotifications(
  onNotificationTap?: (data: Record<string, any>) => void,
): Promise<(() => void) | null> {
  try {
    // Check if running inside Expo Go (SDK 53+ removed remote push notifications from Expo Go)
    const isExpoGo =
      Constants.appOwnership === 'expo' ||
      Constants.executionEnvironment === 'storeClient';

    if (isExpoGo || !Device.isDevice) {
      // In Expo Go or simulator, skip remote push registration cleanly without warnings or thread blocking
      return null;
    }

    // 5. Setup response tap listener for deep linking
    let lastResponseId: string | undefined;
    const handleResponse = (response: Notifications.NotificationResponse) => {
      const request = response.notification.request;
      if (request.identifier === lastResponseId) return;
      lastResponseId = request.identifier;
      if (request.content.data) onNotificationTap?.(request.content.data);
      void Notifications.clearLastNotificationResponseAsync().catch(() => {});
    };
    const responseSub = Notifications.addNotificationResponseReceivedListener(handleResponse);
    void Notifications.getLastNotificationResponseAsync()
      .then((response) => { if (response) handleResponse(response); })
      .catch(() => {});

    let disposed = false;
    const registerDevice = async () => {
      // 1. Android notification channels
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'CIRCLE Notifications',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#5B7B6D',
        });
      }

      // 2. Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return;
      }

      // 3. Obtain Expo Push Token
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ||
        Constants.easConfig?.projectId;

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      const pushToken = tokenData.data;

      // 4. Register with backend
      const deviceId = await getDeviceId();
      if (!disposed) await registerPushTokenApi(pushToken, deviceId);
    };
    void registerDevice().catch(() => {});

    return () => {
      disposed = true;
      responseSub.remove();
    };
  } catch (err) {
    // Graceful fallback: do not crash on simulator or missing push credentials
    return null;
  }
}
