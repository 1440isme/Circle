import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';
import {
  SharedAlbumEntity,
  PhotoEntity,
  CreateSharedAlbumInput,
  UpdateSharedAlbumInput,
  AddPhotosInput,
  DecisionWheelEntity,
  CreateWheelInput,
  SpinWheelResult,
  AnonymousPostEntity,
  CreateAnonymousPostInput,
  CalendarEventEntity,
  CreateCalendarEventInput,
  UpdateCalendarEventInput,
  CalendarEventRsvpEntity,
  EventRsvpStatus,
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
} from '@circle/types';

export const TOOLS_KEYS = {
  all: ['circle-tools'] as const,
  albums: (circleId: string) => [...TOOLS_KEYS.all, circleId, 'albums'] as const,
  albumDetail: (circleId: string, albumId: string) =>
    [...TOOLS_KEYS.all, circleId, 'albums', albumId] as const,
  wheels: (circleId: string) => [...TOOLS_KEYS.all, circleId, 'wheels'] as const,
  anonymous: (circleId: string) => [...TOOLS_KEYS.all, circleId, 'anonymous-posts'] as const,
  calendar: (circleId: string, month?: number, year?: number) =>
    [...TOOLS_KEYS.all, circleId, 'calendar', month, year] as const,
  planningSheets: (circleId: string) => [...TOOLS_KEYS.all, circleId, 'planning-sheets'] as const,
  planningSheetDetail: (circleId: string, sheetId: string) =>
    [...TOOLS_KEYS.all, circleId, 'planning-sheets', sheetId] as const,
  liveLocations: (circleId: string) => [...TOOLS_KEYS.all, circleId, 'live-locations'] as const,
  polls: (circleId: string) => [...TOOLS_KEYS.all, circleId, 'polls'] as const,
  pollDetail: (circleId: string, pollId: string) =>
    [...TOOLS_KEYS.all, circleId, 'polls', pollId] as const,
};

// =============================================================================
// 1. SHARED ALBUMS HOOKS (UC14)
// =============================================================================

export function useAlbumsQuery(circleId: string | null) {
  return useQuery({
    queryKey: TOOLS_KEYS.albums(circleId || ''),
    queryFn: async () => {
      if (!circleId) return [];
      const res = await apiRequest<SharedAlbumEntity[]>(`/circles/${circleId}/albums`);
      return res.data;
    },
    enabled: !!circleId,
  });
}

export function useAlbumDetailQuery(circleId: string | null, albumId: string | null) {
  return useQuery({
    queryKey: TOOLS_KEYS.albumDetail(circleId || '', albumId || ''),
    queryFn: async () => {
      if (!circleId || !albumId) return null;
      const res = await apiRequest<SharedAlbumEntity>(
        `/circles/${circleId}/albums/${albumId}`,
      );
      return res.data;
    },
    enabled: !!circleId && !!albumId,
  });
}

export function useCreateAlbumMutation(circleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateSharedAlbumInput) => {
      const res = await apiRequest<SharedAlbumEntity>(`/circles/${circleId}/albums`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TOOLS_KEYS.albums(circleId) });
    },
  });
}

export function useUpdateAlbumMutation(circleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      albumId,
      input,
    }: {
      albumId: string;
      input: UpdateSharedAlbumInput;
    }) => {
      const res = await apiRequest<SharedAlbumEntity>(
        `/circles/${circleId}/albums/${albumId}`,
        {
          method: 'PUT',
          body: JSON.stringify(input),
        },
      );
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: TOOLS_KEYS.albums(circleId) });
      queryClient.invalidateQueries({
        queryKey: TOOLS_KEYS.albumDetail(circleId, variables.albumId),
      });
    },
  });
}

export function useDeleteAlbumMutation(circleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (albumId: string) => {
      const res = await apiRequest<{ success: boolean }>(
        `/circles/${circleId}/albums/${albumId}`,
        {
          method: 'DELETE',
        },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TOOLS_KEYS.albums(circleId) });
    },
  });
}

export function useAddPhotosMutation(circleId: string, albumId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AddPhotosInput) => {
      const res = await apiRequest<PhotoEntity[]>(
        `/circles/${circleId}/albums/${albumId}/photos`,
        {
          method: 'POST',
          body: JSON.stringify(input),
        },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TOOLS_KEYS.albums(circleId) });
      queryClient.invalidateQueries({
        queryKey: TOOLS_KEYS.albumDetail(circleId, albumId),
      });
    },
  });
}

export function useDeletePhotoMutation(circleId: string, albumId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (photoId: string) => {
      const res = await apiRequest<{ success: boolean }>(
        `/circles/${circleId}/photos/${photoId}`,
        {
          method: 'DELETE',
        },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TOOLS_KEYS.albums(circleId) });
      if (albumId) {
        queryClient.invalidateQueries({
          queryKey: TOOLS_KEYS.albumDetail(circleId, albumId),
        });
      }
    },
  });
}

// =============================================================================
// 2. DECISION WHEEL HOOKS (UC16)
// =============================================================================

export function useWheelsQuery(circleId: string | null) {
  return useQuery({
    queryKey: TOOLS_KEYS.wheels(circleId || ''),
    queryFn: async () => {
      if (!circleId) return [];
      const res = await apiRequest<DecisionWheelEntity[]>(`/circles/${circleId}/wheels`);
      return res.data;
    },
    enabled: !!circleId,
  });
}

export function useCreateWheelMutation(circleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateWheelInput) => {
      const res = await apiRequest<DecisionWheelEntity>(`/circles/${circleId}/wheels`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TOOLS_KEYS.wheels(circleId) });
    },
  });
}

export function useSpinWheelMutation(circleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (wheelId: string) => {
      const res = await apiRequest<SpinWheelResult>(
        `/circles/${circleId}/wheels/${wheelId}/spin`,
        {
          method: 'POST',
        },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TOOLS_KEYS.wheels(circleId) });
    },
  });
}

export function useDeleteWheelMutation(circleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (wheelId: string) => {
      const res = await apiRequest<{ success: boolean }>(
        `/circles/${circleId}/wheels/${wheelId}`,
        {
          method: 'DELETE',
        },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TOOLS_KEYS.wheels(circleId) });
    },
  });
}

// =============================================================================
// 3. ANONYMOUS POSTS / WORDS UNSAID HOOKS (UC21)
// =============================================================================

export function useAnonymousPostsQuery(circleId: string | null) {
  return useQuery({
    queryKey: TOOLS_KEYS.anonymous(circleId || ''),
    queryFn: async () => {
      if (!circleId) return [];
      const res = await apiRequest<AnonymousPostEntity[]>(
        `/circles/${circleId}/anonymous-posts`,
      );
      return res.data;
    },
    enabled: !!circleId,
  });
}

export function useCreateAnonymousPostMutation(circleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateAnonymousPostInput) => {
      const res = await apiRequest<AnonymousPostEntity>(
        `/circles/${circleId}/anonymous-posts`,
        {
          method: 'POST',
          body: JSON.stringify(input),
        },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TOOLS_KEYS.anonymous(circleId) });
    },
  });
}

export function useDeleteAnonymousPostMutation(circleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const res = await apiRequest<{ success: boolean }>(
        `/circles/${circleId}/anonymous-posts/${postId}`,
        {
          method: 'DELETE',
        },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TOOLS_KEYS.anonymous(circleId) });
    },
  });
}

// =============================================================================
// 4. GROUP CALENDAR & REMINDERS HOOKS (UC17)
// =============================================================================

export function useCalendarEventsQuery(
  circleId: string | null,
  month?: number,
  year?: number,
) {
  return useQuery({
    queryKey: TOOLS_KEYS.calendar(circleId || '', month, year),
    queryFn: async () => {
      if (!circleId) return [];
      const params = new URLSearchParams();
      if (month) params.append('month', month.toString());
      if (year) params.append('year', year.toString());
      const queryStr = params.toString() ? `?${params.toString()}` : '';
      const res = await apiRequest<CalendarEventEntity[]>(
        `/circles/${circleId}/calendar-events${queryStr}`,
      );
      return res.data;
    },
    enabled: !!circleId,
  });
}

export function useCreateCalendarEventMutation(circleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateCalendarEventInput) => {
      const res = await apiRequest<CalendarEventEntity>(
        `/circles/${circleId}/calendar-events`,
        {
          method: 'POST',
          body: JSON.stringify(input),
        },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TOOLS_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['chat'] });
    },
  });
}

export function useUpdateCalendarEventMutation(circleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      eventId,
      input,
    }: {
      eventId: string;
      input: UpdateCalendarEventInput;
    }) => {
      const res = await apiRequest<CalendarEventEntity>(
        `/circles/${circleId}/calendar-events/${eventId}`,
        {
          method: 'PUT',
          body: JSON.stringify(input),
        },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TOOLS_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['chat'] });
    },
  });
}

export function useCancelCalendarEventMutation(circleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (eventId: string) => {
      const res = await apiRequest<CalendarEventEntity>(
        `/circles/${circleId}/calendar-events/${eventId}/cancel`,
        {
          method: 'PUT',
        },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TOOLS_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['chat'] });
    },
  });
}

export function useDeleteCalendarEventMutation(circleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (eventId: string) => {
      const res = await apiRequest<{ success: boolean }>(
        `/circles/${circleId}/calendar-events/${eventId}`,
        {
          method: 'DELETE',
        },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TOOLS_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['chat'] });
    },
  });
}
export function useRespondEventRsvpMutation(circleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      eventId,
      status,
    }: {
      eventId: string;
      status: EventRsvpStatus;
    }) => {
      const res = await apiRequest<CalendarEventRsvpEntity>(
        `/circles/${circleId}/calendar-events/${eventId}/rsvp`,
        {
          method: 'PUT',
          body: JSON.stringify({ status }),
        },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TOOLS_KEYS.all });
    },
  });
}

// =============================================================================
// 5. COLLABORATIVE PLANNING SHEET HOOKS (UC18)
// =============================================================================

export function usePlanningSheetsQuery(circleId: string | null) {
  return useQuery({
    queryKey: TOOLS_KEYS.planningSheets(circleId || ''),
    queryFn: async () => {
      if (!circleId) return [];
      const res = await apiRequest<PlanningSheetEntity[]>(
        `/circles/${circleId}/planning-sheets`,
      );
      return res.data;
    },
    enabled: !!circleId,
  });
}

export function usePlanningSheetDetailQuery(
  circleId: string | null,
  sheetId: string | null,
) {
  return useQuery({
    queryKey: TOOLS_KEYS.planningSheetDetail(circleId || '', sheetId || ''),
    queryFn: async () => {
      if (!circleId || !sheetId) return null;
      const res = await apiRequest<PlanningSheetEntity>(
        `/circles/${circleId}/planning-sheets/${sheetId}`,
      );
      return res.data;
    },
    enabled: !!circleId && !!sheetId,
  });
}

export function useCreatePlanningSheetMutation(circleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreatePlanningSheetInput) => {
      const res = await apiRequest<PlanningSheetEntity>(
        `/circles/${circleId}/planning-sheets`,
        {
          method: 'POST',
          body: JSON.stringify(input),
        },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TOOLS_KEYS.planningSheets(circleId) });
    },
  });
}

export function useAddSheetColumnMutation(circleId: string, sheetId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AddSheetColumnInput) => {
      const res = await apiRequest<PlanningSheetEntity>(
        `/circles/${circleId}/planning-sheets/${sheetId}/columns`,
        {
          method: 'POST',
          body: JSON.stringify(input),
        },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: TOOLS_KEYS.planningSheetDetail(circleId, sheetId),
      });
      queryClient.invalidateQueries({ queryKey: TOOLS_KEYS.planningSheets(circleId) });
    },
  });
}

export function useAddSheetRowMutation(circleId: string, sheetId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AddSheetRowInput) => {
      const res = await apiRequest<PlanningSheetEntity>(
        `/circles/${circleId}/planning-sheets/${sheetId}/rows`,
        {
          method: 'POST',
          body: JSON.stringify(input),
        },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: TOOLS_KEYS.planningSheetDetail(circleId, sheetId),
      });
      queryClient.invalidateQueries({ queryKey: TOOLS_KEYS.planningSheets(circleId) });
    },
  });
}

export function useUpdateSheetCellMutation(circleId: string, sheetId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      cellId,
      input,
    }: {
      cellId: string;
      input: UpdateSheetCellInput;
    }) => {
      const res = await apiRequest<any>(
        `/circles/${circleId}/planning-sheets/${sheetId}/cells/${cellId}`,
        {
          method: 'PUT',
          body: JSON.stringify(input),
        },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: TOOLS_KEYS.planningSheetDetail(circleId, sheetId),
      });
    },
  });
}

export function useDeletePlanningSheetMutation(circleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sheetId: string) => {
      const res = await apiRequest<{ success: boolean }>(
        `/circles/${circleId}/planning-sheets/${sheetId}`,
        {
          method: 'DELETE',
        },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TOOLS_KEYS.planningSheets(circleId) });
    },
  });
}

// =============================================================================
// 6. LIVE LOCATION SHARING HOOKS (UC19)
// =============================================================================

export function useLiveLocationsQuery(circleId: string | null) {
  return useQuery({
    queryKey: TOOLS_KEYS.liveLocations(circleId || ''),
    queryFn: async () => {
      if (!circleId) return [];
      const res = await apiRequest<LiveLocationEntity[]>(
        `/circles/${circleId}/live-locations`,
      );
      return res.data;
    },
    enabled: !!circleId,
    refetchInterval: 10000, // background refresh every 10s
  });
}

export function useStartLiveLocationMutation(circleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: StartLiveLocationInput) => {
      const res = await apiRequest<LiveLocationEntity>(
        `/circles/${circleId}/live-locations/start`,
        {
          method: 'POST',
          body: JSON.stringify(input),
        },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TOOLS_KEYS.liveLocations(circleId) });
    },
  });
}

export function useUpdateLiveLocationMutation(circleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateLiveLocationInput) => {
      const res = await apiRequest<LiveLocationEntity>(
        `/circles/${circleId}/live-locations`,
        {
          method: 'PUT',
          body: JSON.stringify(input),
        },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TOOLS_KEYS.liveLocations(circleId) });
    },
  });
}

export function useStopLiveLocationMutation(circleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await apiRequest<{ success: boolean; stopped: boolean }>(
        `/circles/${circleId}/live-locations/stop`,
        {
          method: 'POST',
        },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TOOLS_KEYS.liveLocations(circleId) });
    },
  });
}

// =============================================================================
// 7. GROUP POLL HOOKS (UC15)
// =============================================================================

export function usePollsQuery(circleId: string | null) {
  return useQuery({
    queryKey: TOOLS_KEYS.polls(circleId || ''),
    queryFn: async () => {
      if (!circleId) return [];
      const res = await apiRequest<GroupPollEntity[]>(`/circles/${circleId}/polls`);
      return res.data;
    },
    enabled: !!circleId,
  });
}

export function usePollDetailQuery(circleId: string | null, pollId: string | null) {
  return useQuery({
    queryKey: TOOLS_KEYS.pollDetail(circleId || '', pollId || ''),
    queryFn: async () => {
      if (!circleId || !pollId) return null;
      const res = await apiRequest<GroupPollEntity>(
        `/circles/${circleId}/polls/${pollId}`,
      );
      return res.data;
    },
    enabled: !!circleId && !!pollId,
  });
}

export function useCreatePollMutation(circleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreatePollInput) => {
      const res = await apiRequest<GroupPollEntity>(`/circles/${circleId}/polls`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TOOLS_KEYS.polls(circleId) });
    },
  });
}

export function useVotePollMutation(circleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ pollId, input }: { pollId: string; input: VotePollInput }) => {
      const res = await apiRequest<GroupPollEntity>(
        `/circles/${circleId}/polls/${pollId}/vote`,
        {
          method: 'POST',
          body: JSON.stringify(input),
        },
      );
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: TOOLS_KEYS.polls(circleId) });
      queryClient.invalidateQueries({
        queryKey: TOOLS_KEYS.pollDetail(circleId, variables.pollId),
      });
    },
  });
}

export function useClosePollMutation(circleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (pollId: string) => {
      const res = await apiRequest<GroupPollEntity>(
        `/circles/${circleId}/polls/${pollId}/close`,
        {
          method: 'PUT',
        },
      );
      return res.data;
    },
    onSuccess: (_data, pollId) => {
      queryClient.invalidateQueries({ queryKey: TOOLS_KEYS.polls(circleId) });
      queryClient.invalidateQueries({
        queryKey: TOOLS_KEYS.pollDetail(circleId, pollId),
      });
    },
  });
}

export function useDeletePollMutation(circleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (pollId: string) => {
      const res = await apiRequest<{ success: boolean }>(
        `/circles/${circleId}/polls/${pollId}`,
        {
          method: 'DELETE',
        },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TOOLS_KEYS.polls(circleId) });
    },
  });
}

