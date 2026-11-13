import { mobileApiRequest } from './api';
import {
  SharedAlbumEntity,
  PhotoEntity,
  CreateSharedAlbumInput,
  AddPhotosInput,
  DecisionWheelEntity,
  CreateWheelInput,
  UpdateWheelInput,
  WheelFolderEntity,
  CreateWheelFolderInput,
  UpdateWheelFolderInput,
  SpinWheelResult,
  AnonymousPostEntity,
  CreateAnonymousPostInput,
  CalendarEventEntity,
  CreateCalendarEventInput,
  UpdateCalendarEventInput,
  CalendarEventRsvpEntity,
  EventRsvpStatus,
  RespondEventRsvpInput,
  PlanningSheetEntity,
  CreatePlanningSheetInput,
  AddSheetColumnInput,
  AddSheetRowInput,
  UpdateSheetCellInput,
  LiveLocationEntity,
  StartLiveLocationInput,
  UpdateLiveLocationInput,
  GroupPollEntity,
  CreatePollInput,
  VotePollInput,
  MediaHubResponse,
} from '@circle/types';

// =============================================================================
// 1. SHARED ALBUM & MEDIA HUB (UC14)
// =============================================================================

export async function getMediaHubApi(circleId: string): Promise<MediaHubResponse> {
  const res = await mobileApiRequest<MediaHubResponse>(`/circles/${circleId}/media-hub`);
  return res.data;
}

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

export async function updateWheelApi(
  circleId: string,
  wheelId: string,
  input: UpdateWheelInput,
): Promise<DecisionWheelEntity> {
  const res = await mobileApiRequest<DecisionWheelEntity>(`/circles/${circleId}/wheels/${wheelId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function spinAllWheelsApi(
  circleId: string,
): Promise<SpinWheelResult[]> {
  const res = await mobileApiRequest<SpinWheelResult[]>(
    `/circles/${circleId}/wheels/spin-all`,
    {
      method: 'POST',
    },
  );
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


export async function getWheelFoldersApi(
  circleId: string,
): Promise<WheelFolderEntity[]> {
  const res = await mobileApiRequest<WheelFolderEntity[]>(
    `/circles/${circleId}/wheels/folders`,
  );
  return res.data;
}

export async function createWheelFolderApi(
  circleId: string,
  input: CreateWheelFolderInput,
): Promise<WheelFolderEntity> {
  const res = await mobileApiRequest<WheelFolderEntity>(
    `/circles/${circleId}/wheels/folders`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
  return res.data;
}

export async function restoreWheelFolderApi(
  circleId: string,
  folderId: string,
): Promise<DecisionWheelEntity[]> {
  const res = await mobileApiRequest<DecisionWheelEntity[]>(
    `/circles/${circleId}/wheels/folders/${folderId}/restore`,
    {
      method: 'POST',
    },
  );
  return res.data;
}

export async function updateWheelFolderApi(
  circleId: string,
  folderId: string,
  input: UpdateWheelFolderInput,
): Promise<WheelFolderEntity> {
  const res = await mobileApiRequest<WheelFolderEntity>(
    `/circles/${circleId}/wheels/folders/${folderId}`,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    },
  );
  return res.data;
}

export async function deleteWheelFolderApi(
  circleId: string,
  folderId: string,
): Promise<void> {
  await mobileApiRequest(`/circles/${circleId}/wheels/folders/${folderId}`, {
    method: 'DELETE',
  });
}


export async function deleteAllWheelsApi(circleId: string, defaultTitle?: string): Promise<void> {
  const url = defaultTitle
    ? `/circles/${circleId}/wheels?title=${encodeURIComponent(defaultTitle)}`
    : `/circles/${circleId}/wheels`;
  await mobileApiRequest(url, {
    method: 'DELETE',
  });
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

export async function reactAnonymousPostApi(
  circleId: string,
  postId: string,
  emoji: string,
): Promise<any> {
  const res = await mobileApiRequest<any>(
    `/circles/${circleId}/anonymous-posts/${postId}/react`,
    {
      method: 'POST',
      body: JSON.stringify({ emoji }),
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


export async function updateCalendarEventApi(
  circleId: string,
  eventId: string,
  input: UpdateCalendarEventInput,
): Promise<CalendarEventEntity> {
  const res = await mobileApiRequest<CalendarEventEntity>(
    `/circles/${circleId}/calendar-events/${eventId}`,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    },
  );
  return res.data;
}

export async function cancelCalendarEventApi(
  circleId: string,
  eventId: string,
): Promise<CalendarEventEntity> {
  const res = await mobileApiRequest<CalendarEventEntity>(
    `/circles/${circleId}/calendar-events/${eventId}/cancel`,
    {
      method: 'PUT',
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

export async function respondCalendarEventRsvpApi(
  circleId: string,
  eventId: string,
  input: { status: EventRsvpStatus } | RespondEventRsvpInput,
): Promise<CalendarEventRsvpEntity> {
  const res = await mobileApiRequest<CalendarEventRsvpEntity>(
    `/circles/${circleId}/calendar-events/${eventId}/rsvp`,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    },
  );
  return res.data;
}

export const respondEventRsvpApi = respondCalendarEventRsvpApi;

// =============================================================================
export async function getUpcomingCalendarEventsApi(
  circleId: string,
): Promise<CalendarEventEntity[]> {
  const res = await mobileApiRequest<CalendarEventEntity[]>(
    `/circles/${circleId}/calendar-events/upcoming`,
  );
  return res.data;
}

export async function shareCalendarEventToChatApi(
  circleId: string,
  eventId: string,
): Promise<{ success: boolean; messageId: string }> {
  const res = await mobileApiRequest<{ success: boolean; messageId: string }>(
    `/circles/${circleId}/calendar-events/${eventId}/share-to-chat`,
    {
      method: 'POST',
    },
  );
  return res.data;
}

// 5. COLLABORATIVE PLANNING SHEET (UC18)
// =============================================================================

export async function getPlanningSheetsApi(
  circleId: string,
): Promise<PlanningSheetEntity[]> {
  const res = await mobileApiRequest<PlanningSheetEntity[]>(
    `/circles/${circleId}/planning-sheets`,
  );
  return res.data;
}

export async function getPlanningSheetDetailApi(
  circleId: string,
  sheetId: string,
): Promise<PlanningSheetEntity> {
  const res = await mobileApiRequest<PlanningSheetEntity>(
    `/circles/${circleId}/planning-sheets/${sheetId}`,
  );
  return res.data;
}

export async function createPlanningSheetApi(
  circleId: string,
  input: CreatePlanningSheetInput,
): Promise<PlanningSheetEntity> {
  const res = await mobileApiRequest<PlanningSheetEntity>(
    `/circles/${circleId}/planning-sheets`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
  return res.data;
}

export async function addSheetColumnApi(
  circleId: string,
  sheetId: string,
  input: AddSheetColumnInput,
): Promise<PlanningSheetEntity> {
  const res = await mobileApiRequest<PlanningSheetEntity>(
    `/circles/${circleId}/planning-sheets/${sheetId}/columns`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
  return res.data;
}

export async function addSheetRowApi(
  circleId: string,
  sheetId: string,
  input: AddSheetRowInput,
): Promise<PlanningSheetEntity> {
  const res = await mobileApiRequest<PlanningSheetEntity>(
    `/circles/${circleId}/planning-sheets/${sheetId}/rows`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
  return res.data;
}

export async function updateSheetCellApi(
  circleId: string,
  sheetId: string,
  cellId: string,
  input: UpdateSheetCellInput,
): Promise<any> {
  const res = await mobileApiRequest(
    `/circles/${circleId}/planning-sheets/${sheetId}/cells/${cellId}`,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    },
  );
  return res.data;
}

export async function deletePlanningSheetApi(
  circleId: string,
  sheetId: string,
): Promise<void> {
  await mobileApiRequest(`/circles/${circleId}/planning-sheets/${sheetId}`, {
    method: 'DELETE',
  });
}

// =============================================================================
// 6. LIVE LOCATION SHARING (UC19)
// =============================================================================

export async function getLiveLocationsApi(
  circleId: string,
): Promise<LiveLocationEntity[]> {
  const res = await mobileApiRequest<LiveLocationEntity[]>(
    `/circles/${circleId}/live-locations`,
  );
  return res.data;
}

export async function startLiveLocationApi(
  circleId: string,
  input: StartLiveLocationInput,
): Promise<LiveLocationEntity> {
  const res = await mobileApiRequest<LiveLocationEntity>(
    `/circles/${circleId}/live-locations/start`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
  return res.data;
}

export async function updateLiveLocationApi(
  circleId: string,
  input: UpdateLiveLocationInput,
): Promise<LiveLocationEntity> {
  const res = await mobileApiRequest<LiveLocationEntity>(
    `/circles/${circleId}/live-locations`,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    },
  );
  return res.data;
}

export async function stopLiveLocationApi(
  circleId: string,
): Promise<{ success: boolean; stopped: boolean }> {
  const res = await mobileApiRequest<{ success: boolean; stopped: boolean }>(
    `/circles/${circleId}/live-locations/stop`,
    {
      method: 'POST',
    },
  );
  return res.data;
}

// =============================================================================
// 7. GROUP POLL (UC15)
// =============================================================================

export async function getPollsApi(circleId: string): Promise<GroupPollEntity[]> {
  const res = await mobileApiRequest<GroupPollEntity[]>(`/circles/${circleId}/polls`);
  return res.data;
}

export async function createPollApi(
  circleId: string,
  input: CreatePollInput,
): Promise<GroupPollEntity> {
  const res = await mobileApiRequest<GroupPollEntity>(`/circles/${circleId}/polls`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function votePollApi(
  circleId: string,
  pollId: string,
  input: VotePollInput,
): Promise<GroupPollEntity> {
  const res = await mobileApiRequest<GroupPollEntity>(
    `/circles/${circleId}/polls/${pollId}/vote`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
  return res.data;
}

export async function closePollApi(
  circleId: string,
  pollId: string,
): Promise<GroupPollEntity> {
  const res = await mobileApiRequest<GroupPollEntity>(
    `/circles/${circleId}/polls/${pollId}/close`,
    {
      method: 'PUT',
    },
  );
  return res.data;
}

export async function deletePollApi(circleId: string, pollId: string): Promise<void> {
  await mobileApiRequest(`/circles/${circleId}/polls/${pollId}`, {
    method: 'DELETE',
  });
}

export async function shareWheelResultsToChatApi(
  circleId: string,
  results: { wheelTitle: string; winner: string }[],
): Promise<{ success: boolean; messageId: string }> {
  const res = await mobileApiRequest<{ success: boolean; messageId: string }>(
    `/circles/${circleId}/tools/wheels/share-results`,
    {
      method: 'POST',
      body: JSON.stringify({ results }),
    },
  );
  return res.data;
}

