export interface RichReplyPreviewData {
  kind: 'location' | 'poll' | 'calendar' | 'planning' | 'moment' | 'image' | 'file' | 'text';
  title: string;
  thumbnailUrl?: string;
}

export function isSpecialSystemMessage(
  msg: {
    content?: string | null;
    type?: string | null;
  } | null | undefined,
): boolean {
  if (!msg) return false;
  const typeStr = String(msg.type || '');
  if (typeStr === 'CALL_SUMMARY' || typeStr === 'SYSTEM') return true;
  const content = msg.content || '';
  if (content.startsWith('[CALL_SUMMARY]:')) return true;
  if (content.startsWith('{') && (content.includes('"callType"') || content.includes('"system"'))) {
    return true;
  }
  return false;
}

export function getRichReplyPreviewData(
  msg: {
    content?: string | null;
    type?: string | null;
    fileName?: string | null;
    fileUrl?: string | null;
  } | null | undefined,
  t: {
    chat: {
      locationSharedLabel: string;
      pollSharedLabel: string;
      calendarSharedLabel: string;
      planningSharedLabel?: string;
      momentSharedLabel: string;
      imageAttachment: string;
      fileDownload: string;
      defaultMemberName?: string;
    };
    calls?: {
      messageFallback: string;
    };
  },
): RichReplyPreviewData {
  if (!msg) {
    return { kind: 'text', title: t.calls?.messageFallback || '' };
  }

  const content = msg.content || '';

  // 1. Location Pin (Replying IS allowed)
  if (content.startsWith('[LOCATION_PIN]:')) {
    try {
      const data = JSON.parse(content.replace('[LOCATION_PIN]:', ''));
      return {
        kind: 'location',
        title: data.title || data.address || t.chat.locationSharedLabel,
      };
    } catch {
      return { kind: 'location', title: t.chat.locationSharedLabel };
    }
  }

  // 2. Group Poll
  if (content.startsWith('[GROUP_POLL]:')) {
    try {
      const data = JSON.parse(content.replace('[GROUP_POLL]:', ''));
      return {
        kind: 'poll',
        title: data.question || t.chat.pollSharedLabel,
      };
    } catch {
      return { kind: 'poll', title: t.chat.pollSharedLabel };
    }
  }

  // 3. Calendar Event
  if (content.startsWith('[CALENDAR_EVENT]:')) {
    try {
      const data = JSON.parse(content.replace('[CALENDAR_EVENT]:', ''));
      return {
        kind: 'calendar',
        title: data.title || t.chat.calendarSharedLabel,
      };
    } catch {
      return { kind: 'calendar', title: t.chat.calendarSharedLabel };
    }
  }

  // 4. Planning Sheet
  if (content.startsWith('[PLANNING_SHEET]:')) {
    try {
      const data = JSON.parse(content.replace('[PLANNING_SHEET]:', ''));
      return {
        kind: 'planning',
        title: data.title || t.chat.planningSharedLabel || '📋 Bảng kế hoạch',
      };
    } catch {
      return { kind: 'planning', title: t.chat.planningSharedLabel || '📋 Bảng kế hoạch' };
    }
  }

  // 5. Moment
  if (
    (msg.fileName && msg.fileName.startsWith('[MOMENT_REPLY]:')) ||
    (msg.fileUrl && msg.fileUrl.includes('#pip='))
  ) {
    return {
      kind: 'moment',
      title: t.chat.momentSharedLabel,
      thumbnailUrl: msg.fileUrl || undefined,
    };
  }

  // 6. Media / File attachment
  if (msg.fileUrl) {
    const isImage =
      /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(msg.fileUrl) ||
      String(msg.type) === 'FILE' ||
      String(msg.type) === 'IMAGE';
    return {
      kind: isImage ? 'image' : 'file',
      title: msg.fileName || (isImage ? t.chat.imageAttachment : t.chat.fileDownload),
      thumbnailUrl: isImage ? msg.fileUrl : undefined,
    };
  }

  // 7. Regular Text
  return {
    kind: 'text',
    title: content || t.calls?.messageFallback || '',
  };
}
