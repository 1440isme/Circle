import { mobileApiRequest } from './api';
import {
  SharedAlbumEntity,
  PhotoEntity,
  CreateSharedAlbumInput,
  AddPhotosInput,
  DecisionWheelEntity,
  CreateWheelInput,
  SpinWheelResult,
  AnonymousPostEntity,
  CreateAnonymousPostInput,
  CalendarEventEntity,
  CreateCalendarEventInput,
} from '@circle/types';

// =============================================================================
// 1. SHARED ALBUM (UC14)
// =============================================================================

export async function getAlbumsApi(circleId: string): Promise<SharedAlbumEntity[]> {
  const res = await mobileApiRequest<SharedAlbumEntity[]>(`/circles/${circleId}/albums`);
  return res.data;
}

export async function getAlbumDetailApi(
  circleId: string,
  albumId: string,
): Promise<SharedAlbumEntity> {
  const res = await mobileApiRequest<SharedAlbumEntity>(
    `/circles/${circleId}/albums/${albumId}`,
  );
  return res.data;
}

export async function createAlbumApi(
  circleId: string,
  input: CreateSharedAlbumInput,
): Promise<SharedAlbumEntity> {
  const res = await mobileApiRequest<SharedAlbumEntity>(`/circles/${circleId}/albums`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function deleteAlbumApi(circleId: string, albumId: string): Promise<void> {
  await mobileApiRequest(`/circles/${circleId}/albums/${albumId}`, {
    method: 'DELETE',
  });
}

export async function addPhotosApi(
  circleId: string,
  albumId: string,
  input: AddPhotosInput,
): Promise<PhotoEntity[]> {
  const res = await mobileApiRequest<PhotoEntity[]>(
    `/circles/${circleId}/albums/${albumId}/photos`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
  return res.data;
}

export async function deletePhotoApi(circleId: string, photoId: string): Promise<void> {
  await mobileApiRequest(`/circles/${circleId}/photos/${photoId}`, {
    method: 'DELETE',
  });
}

// =============================================================================
// 2. DECISION WHEEL (UC16)
// =============================================================================

export async function getWheelsApi(circleId: string): Promise<DecisionWheelEntity[]> {
  const res = await mobileApiRequest<DecisionWheelEntity[]>(`/circles/${circleId}/wheels`);
  return res.data;
}

export async function createWheelApi(
  circleId: string,
  input: CreateWheelInput,
): Promise<DecisionWheelEntity> {
  const res = await mobileApiRequest<DecisionWheelEntity>(`/circles/${circleId}/wheels`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function spinWheelApi(
  circleId: string,
  wheelId: string,
): Promise<SpinWheelResult> {
  const res = await mobileApiRequest<SpinWheelResult>(
    `/circles/${circleId}/wheels/${wheelId}/spin`,
    {
      method: 'POST',
    },
  );
  return res.data;
}

export async function deleteWheelApi(circleId: string, wheelId: string): Promise<void> {
  await mobileApiRequest(`/circles/${circleId}/wheels/${wheelId}`, {
    method: 'DELETE',
  });
}

// =============================================================================
// 3. ANONYMOUS POST / WORDS UNSAID (UC21)
// =============================================================================

export async function getAnonymousPostsApi(
  circleId: string,
): Promise<AnonymousPostEntity[]> {
  const res = await mobileApiRequest<AnonymousPostEntity[]>(
    `/circles/${circleId}/anonymous-posts`,
  );
  return res.data;
}

export async function createAnonymousPostApi(
  circleId: string,
  input: CreateAnonymousPostInput,
): Promise<AnonymousPostEntity> {
  const res = await mobileApiRequest<AnonymousPostEntity>(
    `/circles/${circleId}/anonymous-posts`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
  return res.data;
}

export async function deleteAnonymousPostApi(
  circleId: string,
  postId: string,
): Promise<void> {
  await mobileApiRequest(`/circles/${circleId}/anonymous-posts/${postId}`, {
    method: 'DELETE',
  });
}

// =============================================================================
// 4. GROUP CALENDAR & REMINDERS (UC17)
// =============================================================================

export async function getCalendarEventsApi(
  circleId: string,
  month?: number,
  year?: number,
): Promise<CalendarEventEntity[]> {
  const params = new URLSearchParams();
  if (month) params.append('month', month.toString());
  if (year) params.append('year', year.toString());
  const queryStr = params.toString() ? `?${params.toString()}` : '';
  const res = await mobileApiRequest<CalendarEventEntity[]>(
    `/circles/${circleId}/calendar-events${queryStr}`,
  );
  return res.data;
}

export async function createCalendarEventApi(
  circleId: string,
  input: CreateCalendarEventInput,
): Promise<CalendarEventEntity> {
  const res = await mobileApiRequest<CalendarEventEntity>(
    `/circles/${circleId}/calendar-events`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
  return res.data;
}

export async function deleteCalendarEventApi(
  circleId: string,
  eventId: string,
): Promise<void> {
  await mobileApiRequest(`/circles/${circleId}/calendar-events/${eventId}`, {
    method: 'DELETE',
  });
}
