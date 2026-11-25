import { Locale, locales } from '../locales';

type NotificationMetadata = {
  circleId?: string;
  circleName?: string;
  channelId?: string;
  eventStart?: string;
  mention?: boolean;
};

export function getNotificationText(type: string, data: NotificationMetadata, locale: Locale) {
  const templates = locales[locale].notificationsCenter.events;
  const key = type === 'CHAT_MESSAGE' && data.mention ? 'CHAT_MENTION' : type;
  const template = templates[key as keyof typeof templates];
  if (!template || typeof template.body !== 'string') return null;

  return {
    title: template.title,
    content: template.body.replace('{circle}', data.circleName ?? ''),
  };
}

export function getCircleNotificationDestination(item: {
  type?: string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: NotificationMetadata | null;
}) {
  const circleId = item.metadata?.circleId ?? (item.targetType === 'circle' ? item.targetId : null);
  if (!circleId) return null;

  const screen = item.type?.startsWith('CALENDAR_') ? 'calendar' :
    item.type?.startsWith('POLL_') ? 'polls' :
    item.type === 'MOMENT_NEW' ? 'moments' : 'chat';

  return {
    circleId,
    screen,
    targetId: item.targetId ?? undefined,
    channelId: item.metadata?.channelId,
    eventStart: item.metadata?.eventStart,
    joinRequests: item.type === 'CIRCLE_JOIN_REQUEST',
  };
}

export function getActiveCircleMute(mutedUntil: string | null) {
  const minutes = mutedUntil ? (Date.parse(mutedUntil) - Date.now()) / 60_000 : 0;
  if (minutes <= 0) return null;
  if (minutes <= 15) return '15m';
  if (minutes <= 60) return '1h';
  if (minutes <= 480) return '8h';
  if (minutes <= 1440) return '24h';
  return 'forever';
}
