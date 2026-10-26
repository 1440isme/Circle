import { mobileApiRequest } from './api';
import { MessageEntity, SearchMessagesResult } from '@circle/types';

/**
 * Edit a sent text message (CHT-09)
 */
export async function editMessageApi(messageId: string, content: string): Promise<MessageEntity> {
  const res = await mobileApiRequest<MessageEntity>(`/messages/${messageId}`, {
    method: 'PATCH',
    body: JSON.stringify({ content }),
  });
  return res.data;
}

/**
 * Recall a message for everyone in the circle (CHT-10)
 */
export async function recallMessageApi(messageId: string): Promise<MessageEntity> {
  const res = await mobileApiRequest<MessageEntity>(`/messages/${messageId}`, {
    method: 'DELETE',
  });
  return res.data;
}

/**
 * Search messages in a channel (CHT-17)
 */
export async function searchMessagesApi(
  channelId: string,
  query: string,
): Promise<SearchMessagesResult> {
  const res = await mobileApiRequest<SearchMessagesResult>(
    `/channels/${channelId}/messages/search?q=${encodeURIComponent(query)}`,
  );
  return res.data;
}
