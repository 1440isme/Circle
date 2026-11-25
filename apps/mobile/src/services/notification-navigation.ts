import { getCircleNotificationDestination } from '@circle/shared';
import { NotificationEntity } from '@circle/types';
import type { useRouter } from 'expo-router';

type Router = ReturnType<typeof useRouter>;

type NotificationTarget = Partial<Pick<NotificationEntity, 'type' | 'targetType' | 'targetId' | 'deepLink' | 'metadata'>>;

export function openMobileNotification(router: Router, item: NotificationTarget) {
  const target = getCircleNotificationDestination(item);
  if (target) {
    const tool = target.screen === 'calendar' ? 'calendar' : target.screen === 'polls' ? 'poll' : undefined;
    router.push({
      pathname: '/circle/[id]',
      params: {
        id: target.circleId,
        tab: tool ? 'tools' : target.screen === 'moments' ? 'moments' : 'chat',
        ...(tool && { tool }),
        ...(target.joinRequests && { action: 'joinRequests' }),
        ...(target.screen === 'chat' && item.targetType === 'message' && target.targetId && { messageId: target.targetId }),
        ...(target.channelId && { channelId: target.channelId }),
        ...(target.screen === 'calendar' && target.eventStart && { eventStart: target.eventStart }),
        ...(tool && target.targetId && { toolTargetId: target.targetId }),
      },
    });
  } else if (item.deepLink && /^\/[a-z]/i.test(item.deepLink)) {
    router.push(item.deepLink as Parameters<Router['push']>[0]);
  }
}
